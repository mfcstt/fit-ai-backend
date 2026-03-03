import type { WeekDay } from "../generated/prisma/enums";
import { ForbiddenError, NotFoundError } from "../errors/error";
import type { WorkoutRepository } from "../repositories/workout-repository";

interface Input {
  userId: string;
  workoutPlanId: string;
}

interface Output {
  id: string;
  name: string;
  workoutDays: Array<{
    id: string;
    weekDay: WeekDay;
    name: string;
    isRest: boolean;
    coverImageUrl?: string;
    estimatedDurationInSeconds: number;
    exercisesCount: number;
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

export class GetWorkoutPlanById {
  constructor(private repository: WorkoutRepository) {}

  async execute(data: Input): Promise<Output> {
    const workoutPlan = await this.repository.findWorkoutPlanById({
      workoutPlanId: data.workoutPlanId,
    });

    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== data.userId) {
      throw new ForbiddenError("You can only access your own workout plan");
    }

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
        id: workoutDay.id,
        weekDay: workoutDay.weekDay,
        name: WEEK_DAY_NAMES[workoutDay.weekDay],
        isRest: workoutDay.isRest,
        ...(workoutDay.coverImageUrl
          ? { coverImageUrl: workoutDay.coverImageUrl }
          : {}),
        estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
        exercisesCount: workoutDay.exercisesCount,
      })),
    };
  }
}
