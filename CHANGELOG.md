# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Conventional Commits drive entries — see `commitlint.config.mjs`.

## [Unreleased]

### Added

- **Page entrance animation.** Routed content fades/slides in on navigation via a `pageEnter` keyframe, gated behind `prefers-reduced-motion` so motion-sensitive users get an instant swap. Complements the existing route-loading top bar (`LinearProgress` on `navigation.state`) and per-action button loaders.
- **Production hardening pass.** Query-shape composite indexes on `Meal`, `Coupon`, and `Order` (with migration `20260602194500_query_shape_indexes`); shared cursor-pagination helpers (`paginateSlice` / `mapPaginated`) consumed by every list controller/service; `assertNonEmptyUpdate` guard rejecting no-op PATCH bodies; and a broad unit/regression suite (problem-details filter, `RolesGuard`/`JwtAuthGuard`, health, `UsersService` P2002 mapping, pagination helpers, router loaders, auth/checkout schemas). API coverage scope widened beyond `domain/` to services, guards, and common utilities.
- **Themed root background.** `index.html` paints `background.default` per scheme before MUI's runtime styles load (no dark-mode load flash), and CssBaseline now themes `<html>` so the overscroll/canvas area matches the active scheme.
- **Guest cart and checkout flow:** `/cart` is open to anonymous visitors, customers, and owners. Auth is required only at `/checkout`, which shows a demo payment form (no real PSP). Sign-in and sign-up preserve `?from=` through cross-links and header/footer CTAs so users return to their intended page after auth.
- **Dark mode** — Saffron & Espresso palette (warm cream light theme, espresso dark theme) with a header theme toggle cycling system → light → dark; preference persists in localStorage.
- **`ARCHITECTURE.md`** — demo script, architecture talking points, validation commands, scope boundaries, and scale path.
- **Meals:** owners can edit meal details (`PATCH /meals/:id`), reactivate deactivated meals (`POST /meals/:id/reactivate`), and enter prices in dollars (e.g. `12.99`) instead of cents on the dashboard.
- **Landing page "Two paths" section** — closing block with side-by-side `For diners` / `For restaurants` cards (each with an accent gradient bloom and a single primary CTA) so anonymous visitors immediately see both audiences the product serves.

### Changed

- **Header nav restructured.** Desktop nav groups page links (Restaurants → Orders → Dashboard → Cart) and separates a utility cluster (theme toggle + account/auth) with a divider, instead of leading with the theme toggle. The whole cluster stays inside one `nav[aria-label="Primary"]` landmark.
- **Brand surfaces & teal palette.** Replaced the muddy hero/auth gradient (which faded to a near-black brown) with a clean, saturated warm ramp + soft glow, shared between the landing hero and the auth brand panel. Promoted the lighter teal to the canonical `secondary.main` in both schemes (deeper `secondary.dark` retained for text on light tints); white text restored on light-mode teal buttons. Teal info alerts now share one `secondaryInfoAlertSx` helper so the shade is consistent per scheme. Removed the duplicative brand lockup from the auth card (the header already carries it).
- **Demo conveniences gated & hardened.** Swagger UI is now behind `ENABLE_SWAGGER` (default on for the demo); the web container's nginx runs unprivileged on `8080` (`5173:8080`) with proxy timeouts and body-size limits; `api`/`web` compose services drop capabilities and set `no-new-privileges`. `.env.example` documents the prod-shape overrides.
- **Owners can place orders:** `POST /orders` and `POST /orders/:id/duplicate` accept owners as well as customers. The order status state machine derives permissions from the actor's relationship to the order (customer-of, owner-of) rather than JWT role alone; `GET /orders` uses a single `listAccessible` query so owners see both incoming restaurant orders and orders they placed. Reverts the earlier cart gate and "header hides Cart for owners" behavior — cart and checkout are available to every visitor.
- **Web theme** — repainted from tomato/off-white to the Saffron & Espresso palette (warm cream backgrounds, saffron primary, teal secondary).
- **Public-facing copy de-developer-ized.** The product chrome no longer leaks its implementation or its origin as an interview artifact:
  - `AppFooter` description rewritten as a consumer tagline; the `Developers` column (linking to `/docs` and `/healthz`) is gone — those are operator/API surfaces, not customer surfaces; columns are now `Explore` and `Account` linking only to real product routes; the version + stack line (`v0.9 · React · NestJS · PostgreSQL`) and the `Built for interview walkthroughs` copyright tag are replaced with `© {year} Food Delivery. All rights reserved.` plus a warm sign-off.
  - `AuthShell` brand panel headline is now `Order tonight from the kitchens you love.` and the footer caption is `Independent kitchens · Fresh tonight` (was `NestJS · React · PostgreSQL`).
- **Orders page UX polish:**
  - Status filter switched from a multi-select `ToggleButtonGroup` to a scrollable single-select MUI `Tabs` strip with an "All" tab pinned at the start. The strip bleeds flush to the viewport edges on mobile (no scroll-button chevrons on touch) so the whole status list is swipeable, and order lifecycle order is documented inline (`Placed → Preparing → Out for delivery → Delivered → Received`, with `Canceled` pinned at the end as a terminal side-step).
  - Mobile order cards condensed: the giant top thumbnail is gone — every card now renders as a thumbnail + content row at all breakpoints, with smaller padding, tighter inter-row spacing, and the price moved into the header row alongside the status badge so customers see the order ID, status, restaurant, time, and total without scrolling. The `#ID` hash is hidden on `xs` (still visible from `sm` up and on the order detail page).
- **Landing page redesign:** refined hero (status-pill eyebrow, two-line headline with accent line, glow ornament, fixed-height CTAs, divider-separated stats), numbered "How it works" cards (`Step 01/02/03` with tinted icon badge), bigger 16:10 featured-kitchen covers with a subtle dark overlay and an "Open menu →" affordance, and the new `TwoPaths` section. Section spacing tightened on `xs` so the page reads as a tighter narrative on phones.
- **Stack upgrade to latest majors:** React 18 → 19, MUI v5 → v7, ESLint 9 → 10, `@hookform/resolvers` 3 → 5, lint-staged 15 → 17, commitlint 19 → 21, `@types/react` 18 → 19. MUI Grid props migrated via `@mui/codemod v7.0.0/grid-props`. React 18 reached maintenance-only after React 19 shipped (Dec 2024); the duplicate `@types/react` graph from Prisma studio-core's Radix peers is resolved natively on React 19.
- **Package manager:** pnpm is pinned to v11.5.0 via Corepack, with dependency build scripts reviewed in `allowBuilds` so installs stay deterministic under pnpm's stricter lifecycle-script policy (`@scarf/scarf` is explicitly denied).
- **Compose split for dev/deploy clarity:** `docker-compose.yml` is now `compose.yaml` and contains only postgres (dev infra). The bundled prod-shaped stack moved to `compose.prod.yaml` (`docker compose -f compose.prod.yaml up --build`). Day-to-day dev is `docker compose up -d` + `pnpm dev`. Production is not `docker compose up` — it runs the same images CI builds inside an orchestrator.
- **`compose.prod.yaml` honors the same-origin invariant.** The API container no longer publishes a host port — only the web container does (`5173:8080`; nginx runs unprivileged on `8080`). The SPA, REST API, websocket transport, Swagger UI, and readiness probe are all reached through `http://localhost:5173`, identical to what an orchestrator would put behind a single ingress. `NODE_ENV=production`, `PROD_WEB_ORIGIN`, `PROD_JWT_ACCESS_SECRET`, and demo-only `ALLOW_PROD_SEED=true` are now pinned by the compose override so development `.env` values cannot accidentally drive prod-shaped behavior.
- **Runtime entrypoint no longer invokes `pnpm`.** The API image already contains production dependencies; startup now calls the package-local `prisma migrate deploy` and `tsx prisma/seed.ts` binaries directly. This avoids `pnpm` trying to reconcile/install dependencies in the slim runtime image and aborting startup without a TTY.
- **Nginx deploy probes hardened.** The web container proxies `/health/live` and `/health/ready` to the API through the same front door and disables absolute redirects so `/docs` redirects to `/docs/` without dropping the published port in local compose validation.
- **CI image tagging for deploy rails.** `docker-push` now tags pushed images with `:$CI_COMMIT_SHA` (always — for reproducible pinning and rollbacks), `:latest` (only on the default branch — for staging / demo that follow main), and `:$CI_COMMIT_TAG` (on git tags — for production semver pins). Deployers can pin to whichever tag matches their environment's release policy.
- **Owner dashboard route renamed `/owner` → `/dashboard`.** The page already described itself as "Owner dashboard" (component, document title), so the URL and header nav link now match. Internal directory (`features/owner/`), role enum (`OWNER`), and query-cache keys (`["owner", …]`) are unchanged — this is a UX rename, not a domain refactor.
- **`WEB_ORIGIN` accepts a comma-separated allowlist.** The env validator parses the value into a deduped, normalized list of http(s) origins, and both Nest's HTTP CORS and the Socket.IO engine accept any entry in the list. Production keeps a single canonical origin; local development can list multiple (e.g. `http://localhost:5173,http://192.168.8.121:5173`) so the same compose stack can be driven from a laptop and a phone on the same LAN — useful for testing realtime flows on a real mobile device.
- **Seed:** replaced developer-themed demo data with six realistic restaurants, full menus (~36 meals), multiple coupons, and a richer order history spanning every status. Two secondary customers (`avery.chen@example.com`, `marcus.patel@example.com`) give owner-side history and block-candidate flows realistic data. Landing page copy updated to read like a consumer product.
- **Coverage thresholds enforced in CI:** API unit coverage spans domain logic, the problem-details filter, guards, common utilities/pagination, the users/auth services, and health (`85%` statements/functions/lines, `80%` branches); web app (`78%` statements, `76%` functions, `77%` lines, `65%` branches). GitHub Actions `coverage` job invokes `vitest ... --coverage` directly via `pnpm exec`.
- **Docs sync:** `AGENTS.md`, `README.md`, `.cursor/rules/*.mdc`, and ADR 0009 kept in step with the design system, `AuthShell`, coverage policy, and interview walkthrough.

### Fixed

- **Correctness fixes from the hardening pass.** `GET /health/ready` returns `503` (not `200`) when the database probe fails; concurrent signups map Prisma `P2002` to a typed `RegistrationFailedError` instead of leaking a raw error; the web API client tolerates non-JSON error bodies (content-type check + synthetic `ApiError`); owner-dashboard sections and the landing featured list now show a retry-able error state distinct from "empty"; cursor pages add an `id` tiebreaker so rows can't be skipped/duplicated; `RolesGuard` failures render as problem+json. `couponCode` on `POST /orders` is trimmed and length-validated to match coupon rules; web zod schemas align to the API DTO constraints.
- **"Replace cart" dialog color** uses the brand primary instead of the off-palette amber `warning`.
- **Order actions tightened.** Reorder is available only after the original order is complete (`RECEIVED`), enforced in both the web UI and `OrdersService.duplicate`; active or canceled orders cannot be reordered. The visible cancel-order action now uses the brand primary outline treatment instead of a one-off red button.
- **Restaurants search** input dropped its redundant visible label in favor of the placeholder, keeping an `aria-label` for screen readers.
- **Mobile confirm-dialog UX:** `ConfirmDialog` (and the two ad-hoc dialogs it now subsumes, `RestaurantSwitchDialog` and the reorder prompt on `/orders`) used to render `fullScreen={isXs}` on phones, which left a 400-px empty void between the description and the bottom-anchored buttons. `ConfirmDialog` is now a centered modal at `sm+` and a true **bottom sheet** at `xs` — anchored to the bottom edge, rounded top corners, slide-up entrance, drag-handle affordance, and `env(safe-area-inset-bottom)` padding so it clears the iOS home indicator. Buttons stay in thumb reach without the empty space.
- **Duplicative confirm-dialog copy:** the cancel-order modal used to render `"Cancel this order?"` as the title and `"Cancel this order."` as the body — because the modal pulled its description from `statusActionCopy("CANCELED").description`, which is also used as the action button's tooltip. Decoupled the two contexts: the tooltip copy now describes the consequence (`"Stops the restaurant from preparing it."`), and the modal hardcodes a heavier consequence message (`"Once canceled, the restaurant won't prepare it. You can always place a new order."`). Same treatment for the reorder modal description, which previously ended in a redundant question.
- **Desktop header account control:** the inline `name + Owner chip + Sign out` cluster used to squish the username against the Owner badge and Sign-out button at typical desktop widths. Replaced with a pill-shaped `AccountMenu` trigger (avatar + truncated name + chevron) that opens a dropdown owning the full identity surface (name, email, role chip, sign out). The full name is now only shown inline at `lg` and above; smaller desktop widths fall back to avatar-only.
- **`CoverImage` thumbnail sizing:** in flex rows where the parent's cross-axis size is set by `align-self: stretch` rather than an explicit pixel height, the inner `<img>`'s intrinsic dimensions could leak through and balloon (or starve) the row. The `<img>` is now absolutely positioned inside the already-`position: relative` parent so `height: 100%` resolves reliably regardless of how the parent's height is established. Affected the orders list cards most visibly; all consumers (orders, restaurants, menu, meal detail, owner dashboard, landing) continue to work since they all supply a definite height or aspect ratio.
- **Blocks:** owners can only block customers who have previously ordered from their restaurants; unblocking a missing block returns `404`.
- **Orders:** status transitions are applied atomically against the current status so concurrent updates cannot double-advance.
- **Meals:** public `GET /meals/:id` now returns `404` for inactive meals, matching the active-only public menu list.
- **Cart gate:** the "Add to cart" button on the restaurant menu and meal detail pages is now disabled for anonymous visitors and signed-in owners. The cart store refuses non-customer mutations even if the disabled state is bypassed, so the gate is enforced at the hook layer in addition to the existing `/cart` route guard.
- **Cart route:** `/cart` now requires the `CUSTOMER` role instead of any authenticated user.
- **Session refresh:** expired access tokens that fail refresh now redirect to `/login?from=…` instead of leaving the user on an error boundary.

## [0.9.0] - 2026-05-29

### Added

- **`AuthShell` primitive** — split-screen layout shared by `/login` and `/signup`, with brand gradient panel + value props on the right and the form on the left. Folds to single column on small viewports.

### Changed

- **Login & signup redesigned** to use `AuthShell`. Signup uses a `ToggleButtonGroup` for role selection (Order food / Run a restaurant) instead of a select. Owners now land on `/owner` after signup, customers on `/restaurants`.
- **Not-found page** rebuilt around the design system: branded compass icon, eyebrow + display heading + supporting copy, primary/secondary CTAs.
- **Route error boundary** now uses the same scaffold (icon + eyebrow + heading + detail) and surfaces the `code` from `application/problem+json` errors. Added a Retry CTA next to "Back to restaurants".
- **`AuthBootstrap` loader** — replaced the bare MUI spinner with a branded `FD` mark + pulse animation + status caption.
- **`RestaurantSwitchDialog`** copy & layout polish (max-width cap, bold restaurant name, tighter actions row).
- **Realtime snackbars** — order events now use the humanized status label and short order id (e.g. `Order #JZXB29 → Delivered`) instead of UUIDs and raw enum values.

## [0.8.0] - 2026-05-29

### Added

- **Design system:** Inter Variable font, refined tomato/teal palette, soft Tailwind-inspired shadow scale, full typography scale, and consistent component defaults (cards, buttons, chips, inputs, toggle buttons, dialogs). See [ADR 0009](docs/adr/0009-design-system.md).
- **Web primitives:** Reusable `PageHeader`, `SectionHeader`, `EmptyState`, `StatusBadge`, and `PriceTag` so every page reads from the same vocabulary.
- **Date helpers:** Centralized `formatDate` / `formatDateTime` / `formatRelative` / `shortId` so order metadata is humanized everywhere (e.g. `Placed 20 seconds ago`, `#JZXB29` short IDs).

### Changed

- **Pages redesigned:** Restaurants browse, restaurant menu (cinematic hero), meal detail, cart (two-column with sticky summary), orders list, order detail (cleaner timeline & receipt), and the landing page hero now share a single visual language.
- **Header:** Sticky with backdrop blur, brand mark + wordmark, route-aware tinted nav links, refined user pill, "Get started" CTA.
- **Footer:** Multi-column layout with brand block, product links, and developer links.
- **Status indicators:** Replaced default MUI Chip usages on orders with a tinted dot-and-pill `StatusBadge` (semantic tone per status).
- **CoverImage:** Curated brand gradient palette, optional dark overlay for hero usage, `referrerPolicy="no-referrer"` for stricter image hosts.
- **Nginx CSP:** `img-src` now allows `https:` so external cover imagery (Unsplash CDN) renders in production. Defaults remain locked: no third-party scripts, no framing, no third-party connections.

## [0.7.0] - 2026-05-29

### Added

- **Imagery:** Optional `imageUrl` on `Restaurant` and `Meal` (Prisma migration + API DTOs); demo seed uses curated Unsplash CDN URLs. See [ADR 0008](docs/adr/0008-cover-imagery.md).
- **Web:** Marketing landing page at `/` for anonymous visitors; logged-in customers redirect to `/restaurants`, owners to `/owner`.
- **Web:** Shared `CoverImage` component with deterministic gradient fallback; cover imagery across browse, menu, meal detail, cart, orders, and owner dashboard.
- **Web:** `AppFooter`, theme refinements (card hover, chip styling), client-side restaurant search, sticky cart summary on menu pages, order summary sidebar on cart, color-coded status chips, vertical Stepper timeline on order detail.
- **Web:** Owner forms accept optional cover image URLs; signup page honors `?role=OWNER` from landing CTA.
- **Web:** Auth bootstrap hardening — shared `bootstrapAuth()`, anonymous-route guards on `/login` and `/signup`, polished header nav with active-route styling.

### Changed

- **Web:** Header hides Cart for owners, shows role chip, and uses Sign in / Sign out consistently.

## [0.6.0] - 2026-05-29

### Added

- **Orders:** Inline **Reorder** on the `/orders` history list for customers (with confirmation dialog); any past order can be duplicated, not only terminal ones.
- **Orders:** `restaurant.name` on `OrderResponseDto` so list and detail views show the restaurant name instead of a truncated UUID.
- **Orders:** Optional `?status=` filter on `GET /orders` with an owner-side multi-select filter on the orders page.
- **Blocks:** `GET /blocks/candidates` — owner-scoped list of customers who have ordered and are not yet blocked; owner dashboard uses an Autocomplete instead of pasting customer IDs.
- **Seed:** Second demo restaurant (`Pixel Bistro`), coupons, and a walked-through demo order with a full status timeline (`PLACED` → `DELIVERED`).
- **Docs:** Requirements coverage table in `README.md` pairing every product requirement with code and tests.

### Changed

- **Owner dashboard:** Blocked-customer rows show name and email; block flow selects from recent customers via Autocomplete.

## [0.5.0] - 2026-05-29

### Added

- **CI:** GitHub Actions workflow with `install`/`verify`/`test`/`build` jobs, an `audit` job (`pnpm audit --audit-level=high`), a `coverage` job, an `openapi-drift` check (`pnpm generate && git diff --exit-code packages/api-client`), and integration/e2e tests against a Postgres service container.
- **Docs:** Architecture Decision Records (MADR 4.0.0) under `docs/adr/` covering money as cents, the order status state machine, order item snapshots, the HttpOnly refresh-token cookie, the same-origin web topology, and the locked stack.
- **Nginx:** `/docs`, `/docs/`, and `/docs-json` reverse-proxied through the web container so Swagger UI is reachable via the same front door as the SPA.
- **Tooling:** `package.json` `prepare` script now skips husky when `CI`, `DOCKER_BUILD`, or `NODE_ENV=production` is set, so container builds and CI runners no longer trip over missing `.husky/_/`.

### Changed

- **Auth:** Refresh tokens moved from JSON-body / `localStorage` to an `HttpOnly`, `SameSite=Lax`, path-scoped (`/api/v1/auth`) cookie that is `Secure` in production. Old sessions issued under the previous design are not recognized; users will be logged out on first refresh after the upgrade — see the README "Auth upgrade note".
- **Domain rules:** `.cursor/rules/domain.mdc` now cites the migration name (`20260529150000_check_constraints_and_owner_denorm`) and exact constraint (`Coupon_percentOff_range_check`) backing the `Coupon.percentOff` invariant, so the DTO/zod/DB claim is verifiable.

## Released history

The pre-release commit log below is derived from Conventional Commits up to
the cut for the first reviewable build.

### 2026-05-29

- `chore` Sync rules, docs, env, and compose to current architecture (`7f074ed`).
- `refactor(web)` Data router, feature queries, zod resolver, same-origin (`4d52d55`).
- `refactor(api)` Harden auth, errors, lifecycle, and CORS (`6f0f645`).
- `docs` Lock same-origin topology and icon import policy (`694899c`).
- `fix(web)` Wrap MUI icons to survive lazy chunk interop (`43cbad0`).
- `feat(web)` Migrate to React Router data router (`cff924a`).
- `feat(web)` Proxy api and realtime through web nginx (`4fa70cd`).
- `fix(web)` Add nginx SPA fallback for deep links (`984cf5c`).
- `feat` Complete order validation and smoke coverage (`0a06ce3`).
- `docs` Sync setup guidance and demo notes (`c036249`).
- `feat(web)` Add role-aware order detail and owner dashboard (`de17a9a`).
- `fix(web)` Use integer cents for cart tips (`c9381c4`).
- `test` Add web MSW login coverage and realtime e2e (`1f14788`).
- `feat(api)` Add health probes, migrations, and CI-ready test DB (`f58fbe4`).
- `feat(web)` Wire auth, menu, cart checkout, and orders to API (`e25b146`).
- `feat` Generate typed API client from OpenAPI contract (`b0e8069`).
- `test(api)` Add HTTP e2e workflow coverage (`1bdbb1f`).
- `test(api)` Add Postgres-backed order integration coverage (`81e3252`).
- `chore` Harden config validation and realtime contract (`0efb65d`).
- `feat(api)` Add Socket.IO notifications gateway and order listener (`c0af2e3`).
- `feat(api)` Add orders module with state machine and duplication (`824d7ab`).
- `feat(api)` Add coupons and blocks modules (`2d2bd7a`).
- `feat(api)` Add restaurants and meals modules (`e2f5588`).
- `feat(api)` Add auth and users modules (`2e04e67`).
- `chore` Scaffold monorepo on Node 24 with verified baseline (`12eaf25`).
- `chore` Reset template and add monorepo foundation (`da401b1`).
