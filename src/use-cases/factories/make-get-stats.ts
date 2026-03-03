import { PrismaWorkoutRepository } from "../../repositories/prisma/PrismaWorkoutRepository";
import { GetStats } from "../GetStats";

export function makeGetStats() {
  return new GetStats(new PrismaWorkoutRepository());
}
