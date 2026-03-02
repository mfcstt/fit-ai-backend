# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Fit AI is a fitness workout plan REST API built with Fastify, TypeScript (ESM), Prisma ORM (PostgreSQL), and BetterAuth for authentication. It runs on Node 24.

## Commands

- **Dev server**: `npm run dev` (uses `tsx watch src/server.ts` for hot-reload)
- **Lint**: `npx eslint .`
- **Format**: `npx prettier --write .`
- **Database (Docker)**: `docker compose up -d` (PostgreSQL 16 on port 5432)
- **Generate Prisma client**: `npx prisma generate`
- **Run migrations**: `npx prisma migrate dev`
- **Create migration**: `npx prisma migrate dev --name <migration_name>`

Environment variables are validated at startup via Zod in `src/env.ts`. Copy `.env.example` to `.env` before running.

## Architecture

The project follows a **Clean Architecture / Use-Case** pattern with repository abstraction:

```
src/
  server.ts          — Entry point, starts Fastify on configured PORT
  app.ts             — Fastify app setup: Zod type provider, Swagger docs, route registration, BetterAuth handler
  env.ts             — Zod-validated environment variables (PORT, DATABASE_URL, BETTER_AUTH_*)
  lib/auth.ts        — PrismaClient instantiation (with @prisma/adapter-pg) and BetterAuth configuration
  routes/            — Fastify route definitions (register as plugins with prefix)
  controllers/       — Alternate route/controller definitions (same pattern as routes/)
  use-cases/         — Business logic classes; each use-case receives a repository via constructor injection
  use-cases/factories/ — Factory functions that wire concrete repositories into use-cases
  repositories/      — Repository interfaces (DTOs + contracts)
  repositories/prisma/ — Prisma implementations of repository interfaces
  schema/            — Zod schemas for request/response validation (shared between routes and Swagger)
  errors/            — Custom error classes (e.g. NotFoundError)
  docs/swagger.ts    — Swagger/OpenAPI + Scalar API reference setup
  generated/prisma/  — Auto-generated Prisma client (gitignored, regenerated via `npx prisma generate`)
```

### Key patterns

- **Repository pattern**: Business logic depends on interfaces in `src/repositories/`, not on Prisma directly. Concrete implementations live in `src/repositories/prisma/`. New repositories should follow this pattern.
- **Factory functions**: Use-cases are instantiated via factory functions in `src/use-cases/factories/` which wire the Prisma repository implementation. Routes call these factories rather than constructing use-cases directly.
- **Zod type provider**: Fastify uses `fastify-type-provider-zod` for request/response validation. Route schemas in `src/schema/` are reused in Swagger generation via `jsonSchemaTransform`.
- **Authentication**: BetterAuth handles `/api/auth/*` routes with email/password login. Protected routes validate sessions via `auth.api.getSession()` using request headers. The BetterAuth tables (User, Session, Account, Verification) are defined in the Prisma schema.
- **Prisma client**: Exported from `src/lib/auth.ts` (single shared instance). Uses `@prisma/adapter-pg` driver adapter. The generated client output is at `src/generated/prisma/`.
- **Import sorting**: ESLint enforces sorted imports via `eslint-plugin-simple-import-sort`.

### Database models

The Prisma schema (`prisma/schema.prisma`) defines: User, WorkoutPlan, WorkoutDay, WorkoutExercise, WorkoutSession, plus BetterAuth models (Session, Account, Verification). Domain models use cascading deletes. The `WeekDay` enum is used for workout scheduling.

## API Documentation

Swagger UI is available at `/docs` and the raw OpenAPI spec at `/swagger.json`. BetterAuth's OpenAPI schema is served at `/api/auth/open-api/generate-schema`.
