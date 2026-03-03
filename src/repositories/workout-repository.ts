import type { WeekDay } from "../generated/prisma/enums";

export interface CreateWorkoutPlanDTO {
  name: string;
  userId: string;
  workoutDays: {
    weekDay: string;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercises: {
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }[];
  }[];
}

export interface FindWorkoutDayOwnerDTO {
  workoutPlanId: string;
  workoutDayId: string;
}

export interface StartWorkoutSessionDTO {
  workoutDayId: string;
}

export interface FindWorkoutSessionOwnerDTO {
  workoutPlanId: string;
  workoutDayId: string;
  workoutSessionId: string;
}

export interface UpdateWorkoutSessionDTO {
  workoutSessionId: string;
  completedAt: Date;
}

export interface ActiveWorkoutPlanWithDays {
  id: string;
  workoutDays: {
    id: string;
    workoutPlanId: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    exercisesCount: number;
  }[];
}

export interface WorkoutSessionForConsistency {
  startedAt: Date;
  completedAt: Date | null;
}

export interface FindWorkoutSessionsInRangeDTO {
  userId: string;
  startsAtGte: Date;
  startsAtLte: Date;
}

export interface CountCompletedSessionsOnDateDTO {
  userId: string;
  startOfDay: Date;
  endOfDay: Date;
}

export interface FindWorkoutPlanByIdDTO {
  workoutPlanId: string;
}

export interface WorkoutPlanWithDays {
  id: string;
  name: string;
  userId: string;
  workoutDays: {
    id: string;
    weekDay: WeekDay;
    isRest: boolean;
    coverImageUrl: string | null;
    estimatedDurationInSeconds: number;
    exercisesCount: number;
  }[];
}

export interface FindWorkoutDayByIdDTO {
  workoutPlanId: string;
  workoutDayId: string;
}

export interface WorkoutDayWithDetails {
  id: string;
  weekDay: WeekDay;
  isRest: boolean;
  coverImageUrl: string | null;
  estimatedDurationInSeconds: number;
  userId: string;
  exercises: {
    id: string;
    workoutDayId: string;
    order: number;
    name: string;
    sets: number;
    reps: number;
    restTimeInSeconds: number;
  }[];
  sessions: {
    id: string;
    workoutDayId: string;
    startedAt: Date;
    completedAt: Date | null;
  }[];
}

export interface WorkoutRepository {
  create(data: CreateWorkoutPlanDTO): Promise<{ id: string }>;
  findActiveByUserId(userId: string): Promise<{ id: string } | null>;
  findActivePlanWithDaysByUserId(
    userId: string,
  ): Promise<ActiveWorkoutPlanWithDays | null>;
  findWorkoutDayOwner(
    data: FindWorkoutDayOwnerDTO,
  ): Promise<{ userId: string } | null>;
  findStartedSessionByWorkoutDayId(
    workoutDayId: string,
  ): Promise<{ id: string } | null>;
  startWorkoutSession(data: StartWorkoutSessionDTO): Promise<{ id: string }>;
  findWorkoutSessionOwner(
    data: FindWorkoutSessionOwnerDTO,
  ): Promise<{ userId: string } | null>;
  updateWorkoutSession(data: UpdateWorkoutSessionDTO): Promise<{
    id: string;
    completedAt: Date;
    startedAt: Date;
  }>;
  findWorkoutSessionsInRange(
    data: FindWorkoutSessionsInRangeDTO,
  ): Promise<WorkoutSessionForConsistency[]>;
  countCompletedSessionsOnDate(
    data: CountCompletedSessionsOnDateDTO,
  ): Promise<number>;
  findWorkoutPlanById(
    data: FindWorkoutPlanByIdDTO,
  ): Promise<WorkoutPlanWithDays | null>;
  findWorkoutDayById(
    data: FindWorkoutDayByIdDTO,
  ): Promise<WorkoutDayWithDetails | null>;
}
