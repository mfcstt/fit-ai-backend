import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import type { WorkoutRepository } from "../repositories/workout-repository";

dayjs.extend(utc);

interface Input {
  userId: string;
  from: string;
  to: string;
}

interface Output {
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  constructor(private repository: WorkoutRepository) {}

  async execute(data: Input): Promise<Output> {
    const fromDate = dayjs.utc(data.from);
    const toDate = dayjs.utc(data.to);

    if (!fromDate.isValid() || !toDate.isValid()) {
      throw new Error("Invalid date range");
    }

    if (fromDate.isAfter(toDate)) {
      throw new Error("Invalid date range");
    }

    const workoutSessions = await this.repository.findWorkoutSessionsInRange({
      userId: data.userId,
      startsAtGte: fromDate.startOf("day").toDate(),
      startsAtLte: toDate.endOf("day").toDate(),
    });

    const consistencyByDay: Output["consistencyByDay"] = {};
    const completedDays = new Set<string>();

    let completedWorkoutsCount = 0;
    let totalTimeInSeconds = 0;

    for (const workoutSession of workoutSessions) {
      const dayKey = dayjs.utc(workoutSession.startedAt).format("YYYY-MM-DD");

      if (!consistencyByDay[dayKey]) {
        consistencyByDay[dayKey] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      const dayConsistency = consistencyByDay[dayKey];
      dayConsistency.workoutDayStarted = true;

      if (workoutSession.completedAt) {
        dayConsistency.workoutDayCompleted = true;
        completedWorkoutsCount++;
        completedDays.add(dayKey);

        const durationInSeconds = dayjs
          .utc(workoutSession.completedAt)
          .diff(dayjs.utc(workoutSession.startedAt), "second");

        if (durationInSeconds > 0) {
          totalTimeInSeconds += durationInSeconds;
        }
      }
    }

    const totalSessionsCount = workoutSessions.length;
    const conclusionRate =
      totalSessionsCount === 0
        ? 0
        : completedWorkoutsCount / totalSessionsCount;

    const sortedCompletedDays = Array.from(completedDays).sort();

    let workoutStreak = 0;
    let currentStreak = 0;
    let previousDay: dayjs.Dayjs | null = null;

    for (const completedDay of sortedCompletedDays) {
      const currentDay = dayjs.utc(completedDay);

      if (!previousDay) {
        currentStreak = 1;
      } else {
        const diffInDays = currentDay.diff(previousDay, "day");
        currentStreak = diffInDays === 1 ? currentStreak + 1 : 1;
      }

      if (currentStreak > workoutStreak) {
        workoutStreak = currentStreak;
      }

      previousDay = currentDay;
    }

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }
}
