import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "../env";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({connectionString: env.DATABASE_URL})
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000"],
  socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
        }, 
    },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    openAPI(),
  ]
})




