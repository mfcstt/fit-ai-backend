import type { UserTrainDataRepository } from "../repositories/user-train-data-repository";

interface InputDto {
  userId: string;
}

interface OutputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class GetUserTrainData {
  constructor(private repository: UserTrainDataRepository) {}

  async execute(data: InputDto): Promise<OutputDto> {
    const result = await this.repository.findByUserId(data.userId);

    if (!result) {
      return {
        userId: data.userId,
        weightInGrams: 0,
        heightInCentimeters: 0,
        age: 0,
        bodyFatPercentage: 0,
      };
    }

    return result;
  }
}
