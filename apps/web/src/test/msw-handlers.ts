import { HttpResponse, http, type HttpHandler } from "msw";

// Default request handlers shared by every component test. Each test
// can override or extend these via `server.use(...)` and the handlers
// are reset between tests by the setup hook in `setup.ts`. Keeping the
// defaults narrow (and forcing tests to opt-in to unhandled requests
// via `onUnhandledRequest: 'error'`) makes it loud when a component
// triggers an unexpected request.
export const defaultHandlers: HttpHandler[] = [
  // Auth refresh is wired into the API client and may fire whenever
  // an access token is missing. Treat it as an explicit 401 unless a
  // test opts into a successful refresh response.
  http.post("/api/v1/auth/refresh", () =>
    HttpResponse.json(
      {
        type: "about:blank",
        title: "Refresh token is missing, expired, or has been revoked.",
        status: 401,
        code: "INVALID_REFRESH_TOKEN"
      },
      { status: 401 }
    )
  )
];
