# Architecture & Design Decisions

A food delivery service: a REST API (usable by any front end) plus a React web
app, where customers order meals from restaurants and both sides drive the
order lifecycle in real time. This page is self-contained; the
[README](../README.md) has the deeper reference and the full requirements-to-test table.

## Tech Stack

- **API:** NestJS + Prisma + PostgreSQL, REST documented by OpenAPI, Socket.IO for notifications.
- **Web:** React 19 + Vite + MUI v7, TanStack Query (server state) + Zustand (client state), React Router v7 data router, react-hook-form + zod.
- **Contract:** `packages/api-client` is generated from the API's OpenAPI doc; CI fails on drift.
- **Quality:** strict TypeScript, typed domain errors, unit + integration (Testcontainers) + API e2e (Supertest) + web (Testing Library/MSW) + Playwright smoke.
- **Infra:** pnpm monorepo, Docker images per app, nginx same-origin front door, GitHub Actions with lint, typecheck, test, and build jobs.

## Demo Setup

```bash
cp .env.example .env
docker compose -f compose.prod.yaml up --build
```

Everything is reached through the single web origin (ADR 0005):

- Web: `http://localhost:5173`
- API docs (Swagger): `http://localhost:5173/docs`
- Health: `http://localhost:5173/health/ready`

Demo accounts (`Password123!`):

- Owner: `owner@example.com`
- Primary customer: `customer@example.com` — most seeded orders live here.
- Secondary customers: `avery.chen@example.com`, `marcus.patel@example.com` — extra owner-side history and block-candidate data.

## Suggested Demo Flow

1. Start logged out on `/`; browse restaurants and open a menu.
2. Add to cart anonymously → "Continue to checkout" → land on `/login?from=/checkout`, sign in, place the order.
3. Open `/orders/:orderId`; show the status timeline.
4. Sign in as the owner → `/dashboard`: restaurant, meal, coupon, and blocked-customer management.
5. As the owner, advance the order's status and point out the realtime toast on the customer side.
6. Once an order reaches `RECEIVED`, the customer's **Reorder** unlocks (intentionally gated to completed orders) and rebuilds at current prices.

## Requirements Coverage

How the product requirements map to the build (tests are listed in the README requirements table):

- **REST API for many front ends** — versioned REST + OpenAPI `/docs`; generated typed client; Bearer-token auth works for web or native.
- **Account create / log in, one per email** — `auth` module; `User.email` is unique → typed `RegistrationFailedError`.
- **Restaurant `{name, description}` / Meal `{name, description, price}`** — `restaurants` + `meals` modules; prices are integer cents.
- **Order `{meals, date, total, status}`, single restaurant** — enforced in `OrdersService.place` and in the cart store client-side.
- **Custom tip + coupon percentage discount** — `computePricing` (pure, unit-tested); tip presets + custom amount, coupon applied as a percentage.
- **No payments** — intentionally out of scope.
- **Status flow + role permissions, forward-only** — `OrderStatusMachine.canTransition` (Placed → Processing → In Route → Delivered → Received, plus Cancel); no backward moves; role-scoped who can do what.
- **Notification regardless of screen** — global Socket.IO `NotificationsProvider` shows status changes anywhere in the app.
- **Status history with timestamps** — `OrderStatusEvent` rows written in the same transaction as the transition; rendered as a timeline.
- **Duplicate a previous order** — `POST /orders/:id/duplicate` + **Reorder** UI, completed-orders-only, rebuilt from current prices (drops deactivated meals).
- **Customers and owners list orders** — `GET /orders`, role-scoped (customer sees their own; owner sees orders for their restaurants).
- **Owner blocks a user** — `blocks` module + owner dashboard; blocked customers can't place at that restaurant.
- **MUI web app** — `apps/web` built on MUI v7 with a small design system on top.

## Design Decisions and Trade-offs

- **Money is integer cents end-to-end.** No floats/`Decimal`; formatting only at the UI edge. Trade-off: manual `formatCents`, but zero rounding-drift bugs.
- **Order status is a state machine.** Single source of truth for legal transitions instead of ad-hoc status writes; events persisted transactionally.
- **Order items are snapshotted** (`nameSnapshot`, `priceCentsSnapshot`). Historical orders are immutable even when menus change; reorder rebuilds at current prices.
- **JWT access (in memory) + opaque rotating refresh (HttpOnly cookie).** Refresh hashes stored server-side, `@@unique`, consumed atomically so two concurrent refreshes can't both win. Trade-off: more moving parts than localStorage tokens, far better security posture.
- **Typed errors only.** Domain code throws `DomainError` subclasses with stable `code`s; a global filter renders `application/problem+json`. Clients branch on codes, not strings.
- **Same-origin topology, relative URLs.** nginx proxies `/api` + `/socket.io`; the bundle embeds no host, so one image runs anywhere. Trade-off: needs a proxy in front, gains full host-portability.
- **In-process EventEmitter → Socket.IO gateway.** Simple and demo-friendly today; the documented scale path is a Redis adapter when more than one API instance runs.
- **OpenAPI is the contract.** The web client is generated, and CI fails on drift, so the front end can never silently diverge from the API.
- **Restaurants/meals aren't hard-deleted.** FK-`Restrict` + soft-deactivation keep order history intact.

## Why It's Production-Ready

- **Layered validation:** OpenAPI types → DTO validation → auth/role/ownership guards → domain invariants → PostgreSQL constraints. The API is always the source of truth.
- **Operable:** liveness/readiness probes (readiness checks Postgres), structured JSON logging (pino), migrations applied by the API entrypoint (`prisma migrate deploy`); seeding is refused in production unless explicitly allowed.
- **Hardened:** strict CSP + security headers at nginx, non-root containers, unprivileged nginx; refresh tokens HttpOnly and scoped; CORS/WS origins allowlisted via `WEB_ORIGIN`.
- **Trustworthy pipeline:** CI runs lint, typecheck, unit, integration, API e2e, enforced coverage thresholds, OpenAPI drift check, and build.
- **Deploy story:** `compose.prod.yaml` is a reference local stack; production runs the **same images** CI builds inside an orchestrator (k8s/ECS/Fly/etc.).

## Scale Path

- Swap the Socket.IO in-process emitter for a Redis adapter / message bus once more than one API instance runs.
- The API is stateless behind the proxy, so it scales horizontally; add PgBouncer / read replicas and lean on the existing cursor pagination as data grows.
- Move owner-provided images to object storage + CDN if they become real user content.
- Add hosted observability (Sentry / Datadog) and tracing once there's a deployed environment worth monitoring.

## Validation Commands

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:smoke
PLAYWRIGHT_BASE_URL=http://localhost:5173 pnpm test:smoke   # against compose.prod.yaml
```

## Scope Boundaries

The MVP does not require payments, native apps, geolocation, ETA/ranking, or
an admin console. The data model leaves room for them (e.g. the `UserRole` enum
allows `ADMIN` later) without complicating the current deliverable.
