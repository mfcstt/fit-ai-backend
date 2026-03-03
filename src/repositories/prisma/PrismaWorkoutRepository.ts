import type { WeekDay } from "../../generated/prisma/enums";
import { prisma } from "../../lib/auth";
import type {
  CountCompletedSessionsOnDateDTO,
  CreateWorkoutPlanDTO,
  FindWorkoutDayByIdDTO,
  FindWorkoutPlanByIdDTO,
  FindWorkoutSessionsInRangeDTO,
  FindWorkoutDayOwnerDTO,
  FindWorkoutSessionOwnerDTO,
  StartWorkoutSessionDTO,
  UpdateWorkoutSessionDTO,
  WorkoutRepository,
} from "../workout-repository";

export class PrismaWorkoutRepository implements WorkoutRepository {
  async create(data: CreateWorkoutPlanDTO) {
    const workout = await prisma.workoutPlan.create({
      data: {
        name: data.name,
        user: { connect: { id: data.userId } },
        workoutDays: {
          create: data.workoutDays.map((day) => ({
            weekDay: day.weekDay as WeekDay,
            isRest: day.isRest,
            estimatedDurationInSeconds: day.estimatedDurationInSeconds,
            coverImageUrl: day.coverImageUrl,
            workoutExercises: {
              create: day.exercises,
            },
          })),
        },
      },
    });

    return { id: workout.id };
  }

  async findActiveByUserId(userId: string) {
    return prisma.workoutPlan.findFirst({
      where: {
        userId,
        isActive: true,
      },
      select: { id: true },
    });
  }

  async findActivePlanWithDaysByUserId(userId: string) {
    const workoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        workoutDays: {
          select: {
            id: true,
            workoutPlanId: true,
            isRest: true,
            weekDay: true,
            estimatedDurationInSeconds: true,
            coverImageUrl: true,
            _count: {
              select: {
                workoutExercises: true,
              },
            },
          },
        },
      },
    });

    if (!workoutPlan) {
      return null;
    }

    return {
      id: workoutPlan.id,
      workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
        id: workoutDay.id,
        workoutPlanId: workoutDay.workoutPlanId,
        isRest: workoutDay.isRest,
        weekDay: workoutDay.weekDay,
        estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
        coverImageUrl: workoutDay.coverImageUrl,
        exercisesCount: workoutDay._count.workoutExercises,
      })),
    };
  }

  async findWorkoutDayOwner(data: FindWorkoutDayOwnerDTO) {
    const workoutDay = await prisma.workoutDay.findFirst({
      where: {
        id: data.workoutDayId,
        workoutPlanId: data.workoutPlanId,
      },
      select: {
        workoutPlan: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!workoutDay) {
      return null;
    }

    return { userId: workoutDay.workoutPlan.userId };
  }

  async findStartedSessionByWorkoutDayId(workoutDayId: string) {
    return prisma.workoutSession.findFirst({
      where: {
        workoutDayId,
      },
      select: {
        id: true,
      },
    });
  }

  async startWorkoutSession(data: StartWorkoutSessionDTO) {
    const workoutSession = await prisma.workoutSession.create({
      data: {
        workoutDay: {
          connect: {
            id: data.workoutDayId,
          },
        },
        StartedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    return { id: workoutSession.id };
  }

  async findWorkoutSessionOwner(data: FindWorkoutSessionOwnerDTO) {
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: data.workoutSessionId,
        workoutDayId: data.workoutDayId,
        workoutDay: {
          workoutPlanId: data.workoutPlanId,
        },
      },
      select: {
        workoutDay: {
          select: {
            workoutPlan: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!workoutSession) {
      return null;
    }

    return {
      userId: workoutSession.workoutDay.workoutPlan.userId,
    };
  }

  async updateWorkoutSession(data: UpdateWorkoutSessionDTO) {
    const workoutSession = await prisma.workoutSession.update({
      where: {
        id: data.workoutSessionId,
      },
      data: {
        CompletedAt: data.completedAt,
      },
      select: {
        id: true,
        CompletedAt: true,
        StartedAt: true,
      },
    });

    return {
      id: workoutSession.id,
      completedAt: workoutSession.CompletedAt as Date,
      startedAt: workoutSession.StartedAt,
    };
  }

  async findWorkoutSessionsInRange(data: FindWorkoutSessionsInRangeDTO) {
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: data.userId,
          },
        },
        StartedAt: {
          gte: data.startsAtGte,
          lte: data.startsAtLte,
        },
      },
      select: {
        StartedAt: true,
        CompletedAt: true,
      },
    });

    return workoutSessions.map((workoutSession) => ({
      startedAt: workoutSession.StartedAt,
      completedAt: workoutSession.CompletedAt,
    }));
  }

  async countCompletedSessionsOnDate(data: CountCompletedSessionsOnDateDTO) {
    return prisma.workoutSession.count({
      where: {
        workoutDay: {
          workoutPlan: {
            userId: data.userId,
          },
        },
        StartedAt: {
          gte: data.startOfDay,
          lte: data.endOfDay,
        },
        NOT: {
          CompletedAt: null,
        },
      },
    });
  }

  async findWorkoutPlanById(data: FindWorkoutPlanByIdDTO) {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: data.workoutPlanId,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        workoutDays: {
          select: {
            id: true,
            weekDay: true,
            isRest: true,
            coverImageUrl: true,
            estimatedDurationInSeconds: true,
            _count: {
              select: {
                workoutExercises: true,
              },
            },
          },
        },
      },
    });

    if (!workoutPlan) {
      return null;
    }

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      userId: workoutPlan.userId,
      workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
        id: workoutDay.id,
        weekDay: workoutDay.weekDay,
        isRest: workoutDay.isRest,
        coverImageUrl: workoutDay.coverImageUrl,
        estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
        exercisesCount: workoutDay._count.workoutExercises,
      })),
    };
  }

  async findWorkoutDayById(data: FindWorkoutDayByIdDTO) {
    const workoutDay = await prisma.workoutDay.findFirst({
      where: {
        id: data.workoutDayId,
        workoutPlanId: data.workoutPlanId,
      },
      select: {
        id: true,
        weekDay: true,
        isRest: true,
        coverImageUrl: true,
        estimatedDurationInSeconds: true,
        workoutPlan: {
          select: {
            userId: true,
          },
        },
        workoutExercises: {
          select: {
            id: true,
            workoutDayId: true,
            order: true,
            name: true,
            sets: true,
            reps: true,
            restTimeInSeconds: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        sessions: {
          select: {
            id: true,
            workoutDayId: true,
            StartedAt: true,
            CompletedAt: true,
          },
          orderBy: {
            StartedAt: "desc",
          },
        },
      },
    });

    if (!workoutDay) {
      return null;
    }

    return {
      id: workoutDay.id,
      weekDay: workoutDay.weekDay,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      userId: workoutDay.workoutPlan.userId,
      exercises: workoutDay.workoutExercises,
      sessions: workoutDay.sessions.map((session) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: session.StartedAt,
        completedAt: session.CompletedAt,
      })),
    };
  }
}
