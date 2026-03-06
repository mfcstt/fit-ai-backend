import "dotenv/config";
import Fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { generateDocumentation } from "./docs/swagger.js";
import { auth } from "./lib/auth.js";
import { homeRoutes } from "./routes/home.js";
import { workoutPlanRoutes } from "./routes/workout-plan.js";
import { statsRoutes } from "./routes/stats.js";
import { meRoutes } from "./routes/me.js";
import { aiRoutes } from "./routes/ai.js";
import { fastifyCors } from "@fastify/cors";
import { env } from "./env.js";

export const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await generateDocumentation(app);

await app.register(fastifyCors, {
  origin: env.WEB_APP_BASE_URL,
  credentials: true,
});

app.register(homeRoutes, { prefix: "/home" });
app.register(workoutPlanRoutes, { prefix: "/workout-plans" });
app.register(statsRoutes, { prefix: "/stats" });
app.register(meRoutes, { prefix: "/me" });
app.register(aiRoutes, { prefix: "/ai" });

// Authentication endpoint (BetterAuth)
app.route({
  schema: {
    hide: true, // Hide from documentation
  },
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      // Process authentication request
      const response = await auth.handler(req);
      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      app.log.error;
      reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});
