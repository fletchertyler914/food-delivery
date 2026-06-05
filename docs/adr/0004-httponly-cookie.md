# 4. HttpOnly refresh-token cookie

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Tyler Fletcher
- **Tags:** auth, security, web, cookies

## Context and Problem Statement

Earlier iterations of the auth design returned both the access JWT and the
opaque refresh token in the JSON body of `POST /auth/login` and
`POST /auth/refresh`. The web app stored both in `localStorage` and attached
them on every request. That design has two material problems:

1. **XSS reach.** Any successful XSS into the SPA can read `localStorage`,
   exfiltrate the long-lived refresh token, and impersonate the user
   indefinitely until the user manually logs out everywhere.
2. **Rotation is racy on the client.** Two tabs refreshing at the same time
   both try to consume the same token and have to coordinate via storage
   events.

We want refresh tokens to be unreachable from JavaScript and we want the
server to be the unambiguous authority on which refresh token is currently
live.

## Decision Drivers

- Defense in depth: a successful XSS should not be able to mint new sessions
  forever.
- Same-origin web topology (see ADR 0005) means a first-party cookie scoped
  to `/api/v1/auth` reaches the refresh and logout endpoints without exposing
  itself to any other path.
- Refresh-token rotation must be atomic — exactly one of two concurrent
  refresh requests succeeds (already enforced by `RefreshToken.tokenHash`
  `@@unique` + a single `updateMany`).

## Considered Options

1. **HttpOnly, `Secure` in production, `SameSite=Lax` cookie scoped to
   `/api/v1/auth`; access JWT remains in memory in the SPA.**
2. Keep both tokens in `localStorage`.
3. Both tokens in cookies (including access JWT).
4. BFF that proxies all requests and holds tokens server-side.

## Decision Outcome

Chosen option **1: HttpOnly refresh cookie, in-memory access JWT**.

Implementation lives in `apps/api/src/modules/auth/refresh-token.cookie.ts`:

```ts
response.cookie(REFRESH_TOKEN_COOKIE, token, {
  httpOnly: true,
  secure: options.secure, // true when NODE_ENV === "production"
  sameSite: "lax",
  path: REFRESH_TOKEN_PATH, // "/api/v1/auth"
  maxAge: options.maxAgeSeconds * 1_000
});
```

- The access JWT is returned in the JSON body of login/refresh and the SPA
  keeps it in a Zustand store in memory only. A hard reload drops it; the
  SPA silently calls `/auth/refresh` to mint a new one using the cookie.
- The refresh cookie is `HttpOnly` so it is invisible to JS, `Secure` in
  prod so it never crosses cleartext, `SameSite=Lax` so cross-site POSTs
  cannot trigger it, and scoped to `/api/v1/auth` so it is not attached to
  any other endpoint (no CSRF surface on data endpoints).
- `POST /auth/logout` clears the cookie and revokes the underlying token.

## Consequences

### Positive

- XSS can no longer steal a long-lived refresh token; at worst it can call
  authenticated APIs for the lifetime of the in-memory access JWT.
- Old tokens issued under the previous "tokens in body / localStorage" design
  are not recognized by the new endpoints. Existing sessions are invalidated
  by deploy, which is the desired security posture — see the README note.
- Two concurrent refresh requests can never both succeed (atomic
  `updateMany` on `RefreshToken.tokenHash`).

### Negative / Trade-offs

- Slightly more state to manage on the SPA: it must call `/auth/refresh` on
  startup and on 401 to recover an access JWT.
- The cookie path is API-prefix-coupled. Changing `/api/v1/auth` requires
  updating `REFRESH_TOKEN_PATH` and the nginx proxy in lockstep.
- Non-browser clients (mobile, CLI) use the access JWT in `Authorization:
Bearer` and the JSON-body refresh path — both flows remain available.

## Validation

- `apps/api/src/modules/auth/auth.service.spec.ts` — unit tests for atomic
  consume.
- `apps/api/test/app.e2e-spec.ts` — refresh rotation, cookie set/clear,
  and concurrent-refresh race coverage.
- `apps/web/src/features/auth/LoginPage.test.tsx` — login no longer touches
  `localStorage` for refresh tokens.
