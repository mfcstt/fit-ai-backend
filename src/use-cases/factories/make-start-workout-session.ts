import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { StartWorkoutSession } from "../StartWorkoutSession";

export function makeStartWorkoutSession() {
  return new StartWorkoutSession(new PrismaWorkoutRepository());
}
