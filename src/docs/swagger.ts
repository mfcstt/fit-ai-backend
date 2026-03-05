import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import type { FastifyInstance } from "fastify";
import { jsonSchemaTransform, type ZodTypeProvider } from "fastify-type-provider-zod";

export async function generateDocumentation(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Fit AI API",
        description: "API documentation for Fit AI",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:8080",
        },
      ],
    },
    transform: jsonSchemaTransform,

    
  });

  app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: {
    hide: true,
  },
  handler: async () => {
    return app.swagger();
  },
});

await app.register(fastifyApiReference, {
  routePrefix: "/docs",
  configuration: {
    sources: [
      {
        title: "Fit AI API",
        slug: "fit-ai-api",
        url: "/swagger.json",
      },
      {
        title: "Auth API",
        slug: "auth-api",
        url: "/api/auth/open-api/generate-schema",
      },
    ],
  },
});
}