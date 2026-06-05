# Agents Guide

This file is the canonical entry point for AI agents working in this repo. It supplements (and is consistent with) the rules in `.cursor/rules/`.

## What this project is

A production-grade food delivery application: NestJS + Prisma + PostgreSQL REST API with Socket.IO notifications, plus a React + Vite + MUI web app, in a pnpm monorepo. See `README.md` for the full plan and `.cursor/plans/` for the working plan file.

## Hard rules (do not violate)

- **Stack is locked.** NestJS, Prisma, Postgres, React 19, Vite, MUI v7, TanStack Query, Zustand, React Router v7. Do not introduce alternatives without explicit user approval.
- **Money is integer cents.** Never floats for currency.
- **Status is a state machine.** All transitions go through `OrderStatusMachine`.
- **Errors are typed.** Throw `DomainError` subclasses with stable `code`s. Never `throw new Error(...)` (or `RangeError`, etc.) in service/domain code — domain helpers like `cents`, `discountCents`, and `computePricing` raise typed errors so problem+json codes stay stable.
- **Same-origin web topology.** The web container's nginx (and the Vite dev proxy) reverse-proxies `/api/` and `/socket.io/` into the API. The bundle uses **relative URLs** only — no `VITE_API_URL` / `VITE_WS_URL` env vars exist, no `apiConfig.baseUrl`, and never reintroduce `http://localhost:3000` defaults in client code or `.env`.
- **Compose is split.** `compose.yaml` is dev infra (postgres). `compose.prod.yaml` is the local bundled stack. Neither is the production deployer — production runs the same images in an orchestrator.
- **MUI icons go through `apps/web/src/lib/icons.tsx`.** Do not import from `@mui/icons-material/*` directly — Rollup's CJS interop turns those defaults into module objects in lazy chunks and crashes with React error #130. ESLint enforces this with `no-restricted-imports`.
- **Routing is declared in `apps/web/src/app/router.tsx`.** Auth/role checks belong in route `loader`s (redirect from there), not in component wrappers. There is no `RequireAuth` / `RequireRole`.
- **Server state goes through feature `queryOptions`.** Each feature owns `features/<name>/queries.ts` with a `<feature>Keys` factory and `queryOptions(...)` factories. Loaders, components, and ws cache invalidations all consume those — never inline a `["restaurants", id]` literal in a page.
- **Forms use `zodResolver(schema)`.** No manual `safeParse` in submit handlers. Zod schemas mirror API DTO constraints (length, regex, range).
- **Refresh tokens are atomic.** `RefreshToken.tokenHash` is `@@unique`; the consume path is a single `updateMany` so two concurrent refreshes can never both succeed.
- **Restaurants are not deletable.** FK-`Restrict` from orders. Public meal listing returns active meals only; the owner dashboard uses `GET /restaurants/:restaurantId/meals/all` (auth + ownership) for full lifecycle management.
- **No new dependencies casually.** Justify each one in the PR description.
- **No secrets in commits.** `.env` is gitignored. Use `.env.example` for shape.

## Layout

```
apps/api/             NestJS service
apps/web/             React SPA (data router + feature query factories)
packages/api-client/  OpenAPI-generated client
```

## Workflow

1. Plan first (use plan mode for non-trivial work). Cite file paths.
2. Implement in small, reviewable commits with Conventional Commits messages.
3. Add tests at the **lowest** layer that proves the behavior (see `.cursor/rules/testing.mdc`).
4. Run `pnpm lint && pnpm typecheck && pnpm test:unit` locally before pushing.
5. Update `README.md`, `CHANGELOG.md`, and the relevant rule file when conventions change.

## Architecture walkthrough

For a demo script, architecture talking points, and validation commands, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Common commands

The repo pins Node 24 via `.nvmrc`. Use `fnm use 24` (or `nvm use`) before running anything outside Docker.

```bash
fnm use 24
corepack enable
pnpm install
docker compose up -d   # postgres (dev infra)
pnpm dev               # parallel api + web
pnpm db:migrate        # apply Prisma migrations
pnpm db:seed           # seed demo data
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration  # Testcontainers Postgres
pnpm test:e2e
pnpm test:smoke        # Playwright happy-path smoke
pnpm generate          # regenerate Prisma client + OpenAPI + api-client
pnpm --filter @food-delivery/api exec vitest run --config vitest.unit.config.ts --coverage
pnpm --filter @food-delivery/web exec vitest run --passWithNoTests --coverage
```

For a bundled prod-shape stack (Postgres + API + web, with migrations + optional seed):

```bash
cp .env.example .env
docker compose -f compose.prod.yaml up --build
# SEED_DATABASE=false to skip demo data
```

Demo credentials seeded by `pnpm db:seed` (all `Password123!`):

- Owner: `owner@example.com`
- Primary customer: `customer@example.com` (most seeded orders live here)
- Secondary customers: `avery.chen@example.com`, `marcus.patel@example.com` (extra owner-side order history + block candidates)

## When in doubt

Read `.cursor/rules/*.mdc`. They are short, scoped, and authoritative.
