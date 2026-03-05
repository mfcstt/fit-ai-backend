import z from "zod";

import { WeekDay } from "../generated/prisma/browser";

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1),
      coverImageUrl: z.url().optional(),
      exercises: z.array(
        z.object({
          order: z.number().min(0),
          name: z.string().trim().min(1),
          sets: z.number().min(1),
          reps: z.number().min(1),
          restTimeInSeconds: z.number().min(1),
        }),
      ),
    }),
  ),
});

export const StartWorkoutSessionParamsSchema = z.object({
  workoutPlanId: z.uuid(),
  workoutDayId: z.uuid(),
});

export const StartWorkoutSessionResponseSchema = z.object({
  userWorkoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionBodySchema = z.object({
  completedAt: z.string().datetime(),
});

export const UpdateWorkoutSessionParamsSchema = z.object({
  workoutPlanId: z.uuid(),
  workoutDayId: z.uuid(),
  workoutSessionId: z.uuid(),
});

export const UpdateWorkoutSessionResponseSchema = z.object({
  id: z.uuid(),
  completedAt: z.string().datetime(),
  startedAt: z.string().datetime(),
});

export const GetHomeParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const GetHomeResponseSchema = z.object({
  activeWorkoutPlanId: z.uuid(),
  todayWorkoutDay: z
    .object({
      workoutPlanId: z.uuid(),
      id: z.uuid(),
      name: z.string(),
      isRest: z.boolean(),
      weekDay: z.enum(WeekDay),
      estimatedDurationInSeconds: z.number(),
      coverImageUrl: z.url().optional(),
      exercisesCount: z.number(),
    })
    .optional(),
  workoutStreak: z.number().int().min(0),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const GetWorkoutPlanByIdParamsSchema = z.object({
  id: z.uuid(),
});

export const GetWorkoutPlanByIdResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.uuid(),
      weekDay: z.enum(WeekDay),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.url().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const GetWorkoutDayByIdParamsSchema = z.object({
  workoutPlanId: z.uuid(),
  workoutDayId: z.uuid(),
});

export const GetWorkoutDayByIdResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.url().optional(),
  estimatedDurationInSeconds: z.number(),
  exercises: z.array(
    z.object({
      id: z.uuid(),
      workoutDayId: z.uuid(),
      order: z.number(),
      name: z.string(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
    }),
  ),
  weekDay: z.enum(WeekDay),
  sessions: z.array(
    z.object({
      id: z.uuid(),
      workoutDayId: z.uuid(),
      startedAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      completedAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    }),
  ),
});

export const GetStatsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const GetStatsResponseSchema = z.object({
  workoutStreak: z.number().int().min(0),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number().int().min(0),
  conclusionRate: z.number().min(0),
  totalTimeInSeconds: z.number().int().min(0),
});

export const UserTrainDataSchema = z.object({
  userId: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number(),
});

export const GetMeResponseSchema = UserTrainDataSchema;
