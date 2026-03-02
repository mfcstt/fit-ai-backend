import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { CreateWorkoutPlan } from "../CreateWorkoutPlan";

export function makeCreateWorkoutPlan() {
  return new CreateWorkoutPlan(new PrismaWorkoutRepository());
}
