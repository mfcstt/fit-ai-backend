import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth";
import { ErrorSchema, GetMeResponseSchema } from "../schema";
import { makeGetUserTrainData } from "../use-cases/factories/make-get-user-train-data";

export async function meRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      operationId: "getMe",
      tags: ["Users"],
      summary: "Get authenticated user train data",
      response: {
        200: GetMeResponseSchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const getUserTrainData = makeGetUserTrainData();

      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (!session) {
        return reply.status(401).send({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        });
      }

      try {
        const result = await getUserTrainData.execute({
          userId: session.user.id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
}
