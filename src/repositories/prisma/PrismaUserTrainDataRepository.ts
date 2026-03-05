import { prisma } from "../../lib/auth";
import type {
  UpsertUserTrainDataDTO,
  UserTrainDataRepository,
} from "../user-train-data-repository";

interface UserTrainDataRow {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class PrismaUserTrainDataRepository implements UserTrainDataRepository {
  async upsert(data: UpsertUserTrainDataDTO) {
    const rows = await prisma.$queryRaw<UserTrainDataRow[]>`
      INSERT INTO "user_train_data" (
        "userId",
        "weightInGrams",
        "heightInCentimeters",
        "age",
        "bodyFatPercentage",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${data.userId},
        ${data.weightInGrams},
        ${data.heightInCentimeters},
        ${data.age},
        ${data.bodyFatPercentage},
        NOW(),
        NOW()
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "weightInGrams" = EXCLUDED."weightInGrams",
        "heightInCentimeters" = EXCLUDED."heightInCentimeters",
        "age" = EXCLUDED."age",
        "bodyFatPercentage" = EXCLUDED."bodyFatPercentage",
        "updatedAt" = NOW()
      RETURNING
        "userId",
        "weightInGrams",
        "heightInCentimeters",
        "age",
        "bodyFatPercentage"
    `;

    return rows[0];
  }

  async findByUserId(userId: string) {
    const rows = await prisma.$queryRaw<UserTrainDataRow[]>`
      SELECT
        utd."userId" as "userId",
        utd."weightInGrams" as "weightInGrams",
        utd."heightInCentimeters" as "heightInCentimeters",
        utd."age" as "age",
        utd."bodyFatPercentage" as "bodyFatPercentage"
      FROM "user_train_data" utd
      JOIN "user" u ON u."id" = utd."userId"
      WHERE utd."userId" = ${userId}
      LIMIT 1
    `;

    if (!rows[0]) {
      // retorna os dados se for null retorna o campo + null
      return null;
    }

    return rows[0];
  }
}
