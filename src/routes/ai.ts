import { openai } from "@ai-sdk/openai";
import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";
import { auth } from "../lib/auth";
import { makeCreateWorkoutPlan } from "../use-cases/factories/make-create-workout-plan";
import { makeGetUserTrainData } from "../use-cases/factories/make-get-user-train-data";
import { makeListWorkoutPlans } from "../use-cases/factories/make-list-workout-plans";
import { makeUpsertUserTrainData } from "../use-cases/factories/make-upsert-user-train-data";

const aiSystemPrompt = `Você é um personal trainer virtual especialista em montar planos de treino.

Regras obrigatórias:
- Tom amigável e motivador, linguagem simples, sem jargões técnicos.
- Respostas curtas e objetivas.
- SEMPRE chame a tool getUserTrainData antes de qualquer interação com o usuário.
- Se getUserTrainData retornar null: faça uma única mensagem com perguntas simples e diretas pedindo nome, peso (kg), altura (cm), idade e % de gordura corporal.
- Depois de receber os dados, salve com updateUserTrainData. O peso deve ser convertido de kg para gramas antes de chamar a tool.
- Se getUserTrainData retornar dados: cumprimente o usuário pelo nome.

Para criar plano de treino:
- Faça poucas perguntas e de forma simples: objetivo, dias disponíveis por semana e restrições físicas/lesões.
- O plano precisa ter exatamente 7 dias: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY.
- Dias sem treino devem ser enviados com isRest: true, exercises: [], estimatedDurationInSeconds: 0.
- Sempre chame a tool createWorkoutPlan para criar o plano.

Organização por dias disponíveis (splits):
- 2-3 dias/semana: Full Body ou ABC (A: Peito+Tríceps, B: Costas+Bíceps, C: Pernas+Ombros)
- 4 dias/semana: Upper/Lower (preferencial, 2x por grupo) ou ABCD (A: Peito+Tríceps, B: Costas+Bíceps, C: Pernas, D: Ombros+Abdômen)
- 5 dias/semana: PPLUL (Push/Pull/Legs + Upper/Lower)
- 6 dias/semana: PPL 2x (Push/Pull/Legs repetido)

Princípios gerais:
- Agrupe músculos sinérgicos (peito+tríceps, costas+bíceps).
- Exercícios compostos primeiro, isoladores depois.
- 4 a 8 exercícios por sessão.
- 3-4 séries por exercício.
- Faixa de reps: hipertrofia 8-12, força 4-6.
- Descanso entre séries: 60-90s (hipertrofia), 2-3min (compostos pesados).
- Evite repetir o mesmo grupo muscular em dias consecutivos.
- Use nomes descritivos para os dias (ex.: "Superior A - Peito e Costas", "Descanso").

coverImageUrl (obrigatório em todos os dias):
- Dias de foco superior (peito, costas, ombros, bíceps, tríceps, push, pull, upper, full body):
  1) https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO3y8pQ6GBg8iqe9pP2JrHjwd1nfKtVSQskI0v
  2) https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOW3fJmqZe4yoUcwvRPQa8kmFprzNiC30hqftL
- Dias de foco inferior (pernas, glúteos, quadríceps, posterior, panturrilha, legs, lower):
  1) https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCOgCHaUgNGronCvXmSzAMs1N3KgLdE5yHT6Ykj
  2) https://gw8hy3fdcv.ufs.sh/f/ccoBDpLoAPCO85RVu3morROwZk5NPhs1jzH7X8TyEvLUCGxY
- Alterne entre as 2 opções de cada categoria para variar.
- Dias de descanso usam imagem de superior.`;

export const aiRoutes = async (app: FastifyInstance) => {
  app.post("/ai", async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      return reply.status(401).send({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const getUserTrainData = makeGetUserTrainData();
    const upsertUserTrainData = makeUpsertUserTrainData();
    const listWorkoutPlans = makeListWorkoutPlans();
    const createWorkoutPlan = makeCreateWorkoutPlan();

    const { messages } = request.body as { messages: UIMessage[] };

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: aiSystemPrompt,
      tools: {
        getUserTrainData: tool({
          description:
            "Busca os dados de treino do usuário autenticado. Deve ser chamada primeiro.",
          inputSchema: z.object({}),
          execute: async () => {
            return getUserTrainData.execute({
              userId: session.user.id,
            });
          },
        }),
        updateUserTrainData: tool({
          description:
            "Atualiza os dados de treino do usuário autenticado. O peso deve ser informado em gramas.",
          inputSchema: z.object({
            weightInGrams: z.number().int().positive(),
            heightInCentimeters: z.number().int().positive(),
            age: z.number().int().positive(),
            bodyFatPercentage: z.number().positive(),
          }),
          execute: async (input) => {
            return upsertUserTrainData.execute({
              userId: session.user.id,
              weightInGrams: input.weightInGrams,
              heightInCentimeters: input.heightInCentimeters,
              age: input.age,
              bodyFatPercentage: input.bodyFatPercentage,
            });
          },
        }),
        getWorkoutPlans: tool({
          description:
            "Lista os planos de treino do usuário autenticado para contexto.",
          inputSchema: z.object({}),
          execute: async () => {
            return listWorkoutPlans.execute({
              userId: session.user.id,
            });
          },
        }),
        createWorkoutPlan: tool({
          description:
            "Cria um plano de treino completo com 7 dias (MONDAY a SUNDAY).",
          inputSchema: z.object({
            name: z.string().trim().min(1),
            workoutDays: z
              .array(
                z.object({
                  name: z.string().trim().min(1),
                  weekDay: z.enum(WeekDay),
                  isRest: z.boolean(),
                  estimatedDurationInSeconds: z.number().int().min(0),
                  coverImageUrl: z.string().url(),
                  exercises: z.array(
                    z.object({
                      order: z.number().int().min(0),
                      name: z.string().trim().min(1),
                      sets: z.number().int().min(1),
                      reps: z.number().int().min(1),
                      restTimeInSeconds: z.number().int().min(1),
                    }),
                  ),
                }),
              )
              .length(7),
          }),
          execute: async (input) => {
            return createWorkoutPlan.execute({
              userId: session.user.id,
              name: input.name,
              workoutDays: input.workoutDays,
            });
          },
        }),
      },
      stopWhen: stepCountIs(5),
      messages: await convertToModelMessages(messages),
    });
    const response = result.toUIMessageStreamResponse();

    reply.raw.writeHead(
      response.status,
      Object.fromEntries(response.headers.entries()),
    );

    const reader = response.body!.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply.raw.write(value);
      }
    } finally {
      reply.raw.end();
    }

    return reply;
  });
};
