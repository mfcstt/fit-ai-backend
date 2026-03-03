import dayjs from "dayjs";

import type { WeekDay } from "../generated/prisma/enums";
import { ForbiddenError, NotFoundError } from "../errors/error";
import type { WorkoutRepository } from "../repositories/workout-repository";

interface Input {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface Output {
  id: string;
  name: string;
  isRest: boolean;
  coverImageUrl?: string;
  estimatedDurationInSeconds: number;
  exercises: Array<{
    id: string;
    workoutDayId: string;
    order: number;
    name: string;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
  }>;
  weekDay: WeekDay;
  sessions: Array<{
    id: string;
    workoutDayId: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}

const WEEK_DAY_NAMES: Record<WeekDay, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export class GetWorkoutDayById {
  constructor(private repository: WorkoutRepository) {}

  async execute(data: Input): Promise<Output> {
    const workoutDay = await this.repository.findWorkoutDayById({
      workoutPlanId: data.workoutPlanId,
      workoutDayId: data.workoutDayId,
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found for this workout plan");
    }

    if (workoutDay.userId !== data.userId) {
      throw new ForbiddenError(
        "You can only access workout days from your own workout plan",
      );
    }

    return {
      id: workoutDay.id,
      name: WEEK_DAY_NAMES[workoutDay.weekDay],
      isRest: workoutDay.isRest,
      ...(workoutDay.coverImageUrl
        ? { coverImageUrl: workoutDay.coverImageUrl }
        : {}),
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      exercises: workoutDay.exercises,
      weekDay: workoutDay.weekDay,
      sessions: workoutDay.sessions.map((session) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        ...(session.startedAt
          ? { startedAt: dayjs(session.startedAt).format("YYYY-MM-DD") }
          : {}),
        ...(session.completedAt
          ? { completedAt: dayjs(session.completedAt).format("YYYY-MM-DD") }
          : {}),
      })),
    };
  }
}
