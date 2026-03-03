import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { NotFoundError } from "../errors/error";
import type { WorkoutRepository } from "../repositories/workout-repository";
import type { WeekDay } from "../generated/prisma/enums";

dayjs.extend(utc);

interface Input {
  userId: string;
  date: string;
}

interface Output {
  activeWorkoutPlanId: string;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
  };
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
}

const WEEK_DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const WEEK_DAY_NAMES: Record<(typeof WEEK_DAYS)[number], string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export class GetHomeData {
  constructor(private repository: WorkoutRepository) {}

  async execute(data: Input): Promise<Output> {
    const requestedDate = dayjs.utc(data.date);

    if (
      !requestedDate.isValid() ||
      requestedDate.format("YYYY-MM-DD") !== data.date
    ) {
      throw new Error("Invalid date");
    }

    const activePlan = await this.repository.findActivePlanWithDaysByUserId(
      data.userId,
    );

    if (!activePlan) {
      throw new NotFoundError("Active workout plan not found");
    }

    const currentWeekDay = WEEK_DAYS[requestedDate.day()];

    const todayWorkoutDay = activePlan.workoutDays.find(
      (workoutDay) => workoutDay.weekDay === currentWeekDay,
    );

    if (!todayWorkoutDay) {
      throw new NotFoundError("Workout day not found for provided date");
    }

    const startOfWeek = requestedDate
      .subtract(requestedDate.day(), "day")
      .startOf("day");
    const endOfWeek = startOfWeek.add(6, "day").endOf("day");

    const workoutSessions = await this.repository.findWorkoutSessionsInRange({
      userId: data.userId,
      startsAtGte: startOfWeek.toDate(),
      startsAtLte: endOfWeek.toDate(),
    });

    const consistencyByDay: Output["consistencyByDay"] = {};

    for (let index = 0; index < 7; index++) {
      const dateKey = startOfWeek.add(index, "day").format("YYYY-MM-DD");

      consistencyByDay[dateKey] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    for (const workoutSession of workoutSessions) {
      const dateKey = dayjs.utc(workoutSession.startedAt).format("YYYY-MM-DD");
      const consistency = consistencyByDay[dateKey];

      if (!consistency) {
        continue;
      }

      if (workoutSession.completedAt) {
        consistency.workoutDayCompleted = true;
        consistency.workoutDayStarted = true;
        continue;
      }

      consistency.workoutDayStarted = true;
    }

    let workoutStreak = 0;
    let cursorDate = requestedDate.startOf("day");

    while (true) {
      const completedCount = await this.repository.countCompletedSessionsOnDate(
        {
          userId: data.userId,
          startOfDay: cursorDate.startOf("day").toDate(),
          endOfDay: cursorDate.endOf("day").toDate(),
        },
      );

      if (completedCount === 0) {
        break;
      }

      workoutStreak++;
      cursorDate = cursorDate.subtract(1, "day");
    }

    return {
      activeWorkoutPlanId: activePlan.id,
      todayWorkoutDay: {
        workoutPlanId: todayWorkoutDay.workoutPlanId,
        id: todayWorkoutDay.id,
        name: WEEK_DAY_NAMES[currentWeekDay],
        isRest: todayWorkoutDay.isRest,
        weekDay: todayWorkoutDay.weekDay,
        estimatedDurationInSeconds: todayWorkoutDay.estimatedDurationInSeconds,
        ...(todayWorkoutDay.coverImageUrl
          ? { coverImageUrl: todayWorkoutDay.coverImageUrl }
          : {}),
        exercisesCount: todayWorkoutDay.exercisesCount,
      },
      workoutStreak,
      consistencyByDay,
    };
  }
}
