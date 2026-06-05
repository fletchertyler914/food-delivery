# 6. Locked stack

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Tyler Fletcher
- **Tags:** process, dependencies, governance

## Context and Problem Statement

The project is a scoped MVP with a fixed feature set. We want to spend
implementation budget on domain correctness — money math, the order state
machine, snapshots, the auth model — rather than on framework experiments.
At the same time, the project lives long enough that drift is real: it is
easy for "let's swap state library X" to creep in over a sequence of small
PRs until the codebase has two ways to do every common thing.

## Decision Drivers

- Reviewability: a code reviewer should be able to predict where new code
  lives.
- One way to do common things (HTTP, server state, client state, forms,
  validation, testing).
- Small dependency surface for security and SBOM hygiene (ADR alignment
  with the supply-chain scans in CI).
- Speed of onboarding for whoever inherits the codebase.

## Considered Options

1. **Lock the stack. New libraries require an ADR or explicit approval in
   PR.**
2. Open stack — let each PR pick the best tool.
3. Hybrid: lock at the layer (e.g. one HTTP framework) but allow drop-in
   alternatives within (e.g. any state lib).

## Decision Outcome

Chosen option **1: lock the stack**.

Updated 2026-06-01: rebased web and tooling to latest majors — React 19, MUI v7,
ESLint 10, `@hookform/resolvers` v5, lint-staged 17, commitlint 21. React 18
reached maintenance-only status after React 19 shipped (Dec 2024); MUI v5 was
two majors behind. Emotion remains the CSS-in-JS engine (Pigment CSS deferred).

### Locked layers

| Layer            | Library                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Monorepo         | pnpm workspaces, Node `>=24.0.0`                                                                                   |
| API framework    | NestJS                                                                                                             |
| ORM              | Prisma + PostgreSQL                                                                                                |
| API contract     | REST + OpenAPI (generated `@food-delivery/api-client`)                                                             |
| Realtime         | Socket.IO                                                                                                          |
| Web framework    | React 19                                                                                                           |
| Web bundler      | Vite                                                                                                               |
| Web UI           | MUI v7 (icons via `apps/web/src/lib/icons.tsx`)                                                                    |
| Web server state | TanStack Query (per-feature `queryOptions` factories)                                                              |
| Web client state | Zustand                                                                                                            |
| Web routing      | React Router v7 data router (guards in loaders, no `RequireAuth`)                                                  |
| Forms            | react-hook-form + zod (`zodResolver(schema)`)                                                                      |
| Tests            | Vitest/Jest (unit), Testcontainers (integration), Supertest (e2e), Testing Library + MSW (web), Playwright (smoke) |

### Rules

- Any deviation requires an ADR superseding this one for that specific layer.
- New direct dependencies must be justified in the PR description.
- Web MUI icons go through `apps/web/src/lib/icons.tsx` only. Direct
  `@mui/icons-material/*` imports break lazy chunks with React error #130
  and are enforced off by `no-restricted-imports`.
- No reintroduction of `VITE_API_URL` / `VITE_WS_URL` or
  `apiConfig.baseUrl` — see ADR 0005.

## Consequences

### Positive

- Reviewers know exactly where to look; PRs that touch "the wrong layer"
  stand out.
- SBOMs (CI `sbom` job) stay small and easy to audit.
- Onboarding is "read AGENTS.md + the ADRs" rather than "ramp up on N
  frameworks".

### Negative / Trade-offs

- Sometimes the locked tool is not the best for a one-off task. Accept the
  cost; the reviewability win is bigger than the marginal task win.
- New contributors may have to learn a tool they would not have picked
  themselves.

## Validation

- `.cursor/rules/repo.mdc` and `AGENTS.md` codify the locked list and call
  it out as non-negotiable.
- `apps/web/eslint.config.mjs` mechanically enforces the icons and same-origin
  rules.
- This ADR is referenced from `docs/adr/README.md`.
