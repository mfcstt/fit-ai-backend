import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { GetWorkoutDayById } from "../GetWorkoutDayById";

export function makeGetWorkoutDayById() {
  return new GetWorkoutDayById(new PrismaWorkoutRepository());
}
