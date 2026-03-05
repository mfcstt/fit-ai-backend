import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { NotFoundError } from "../errors/error";
import { auth } from "../lib/auth";
import {
  ErrorSchema,
  GetHomeParamsSchema,
  GetHomeResponseSchema,
} from "../schema";
import { makeGetHomeData } from "../use-cases/factories/make-get-home-data";

export async function homeRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:date",
    schema: {
      operationId: "getHomeData",
      tags: ["Home"],
      summary: "Get home data by date",
      params: GetHomeParamsSchema,
      response: {
        200: GetHomeResponseSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const getHomeData = makeGetHomeData();

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
        const result = await getHomeData.execute({
          userId: session.user.id,
          date: request.params.date,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "NOT_FOUND",
          });
        }

        if (error instanceof Error && error.message === "Invalid date") {
          return reply.status(400).send({
            error: error.message,
            code: "BAD_REQUEST",
          });
        }

        return reply.status(500).send({
          error: "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
}
