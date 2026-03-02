import { ConflictError, ForbiddenError, NotFoundError } from "../errors/error";
import type { WorkoutRepository } from "../repositories/workout-repository";

interface Input {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

interface Output {
  userWorkoutSessionId: string;
}

export class StartWorkoutSession {
  constructor(private repository: WorkoutRepository) {}

  async execute(data: Input): Promise<Output> {
    const owner = await this.repository.findWorkoutDayOwner({
      workoutPlanId: data.workoutPlanId,
      workoutDayId: data.workoutDayId,
    });

    if (!owner) {
      throw new NotFoundError("Workout day not found for this workout plan");
    }

    if (owner.userId !== data.userId) {
      throw new ForbiddenError(
        "You can only start sessions for your own workout plan",
      );
    }

    const existingSession =
      await this.repository.findStartedSessionByWorkoutDayId(data.workoutDayId);

    if (existingSession) {
      throw new ConflictError("This workout day already has a started session");
    }

    const workoutSession = await this.repository.startWorkoutSession({
      workoutDayId: data.workoutDayId,
    });

    return { userWorkoutSessionId: workoutSession.id };
  }
}
