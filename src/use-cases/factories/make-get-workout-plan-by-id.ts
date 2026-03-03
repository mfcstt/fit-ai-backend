import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { GetWorkoutPlanById } from "../GetWorkoutPlanById";

export function makeGetWorkoutPlanById() {
  return new GetWorkoutPlanById(new PrismaWorkoutRepository());
}
