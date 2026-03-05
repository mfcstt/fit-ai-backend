import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	throw new Error(`Invalid environment variables: ${z.prettifyError(parsedEnv.error)}`);
}

export const env = parsedEnv.data;