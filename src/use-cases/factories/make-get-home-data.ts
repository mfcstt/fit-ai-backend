import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { GetHomeData } from "../GetHomeData";

export function makeGetHomeData() {
  return new GetHomeData(new PrismaWorkoutRepository());
}
