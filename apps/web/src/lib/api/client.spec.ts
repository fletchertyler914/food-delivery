import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../../features/auth/auth.store";
import { server } from "../../test/msw-server";
import { ApiError, apiRequest } from "./client";

const originalLocation = window.location;

afterEach(() => {
  useAuthStore.getState().clearSession();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation
  });
});

describe("apiRequest refresh interceptor", () => {
  it("attaches the bearer token when an access token is in the store", async () => {
    let receivedAuth: string | null = null;
    server.use(
      http.get("/api/v1/me", ({ request }) => {
        receivedAuth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      })
    );

    useAuthStore.getState().setSession({
      accessToken: "first-token",
      user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
    });

    await apiRequest<{ ok: true }>("/api/v1/me");

    expect(receivedAuth).toBe("Bearer first-token");
  });

  it("retries with a refreshed token when the access token has expired", async () => {
    const authStates: string[] = [];
    server.use(
      http.get("/api/v1/me", ({ request }) => {
        authStates.push(request.headers.get("Authorization") ?? "");
        if (authStates.length === 1) {
          return HttpResponse.json(
            {
              type: "about:blank",
              title: "Access token has expired.",
              status: 401,
              code: "ACCESS_TOKEN_EXPIRED"
            },
            { status: 401 }
          );
        }
        return HttpResponse.json({ ok: true });
      }),
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({
          accessToken: "fresh-token",
          user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
        })
      )
    );

    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
    });

    const body = await apiRequest<{ ok: true }>("/api/v1/me");

    expect(body).toEqual({ ok: true });
    expect(authStates).toEqual(["Bearer stale-token", "Bearer fresh-token"]);
    expect(useAuthStore.getState().accessToken).toBe("fresh-token");
  });

  it("redirects to login and clears the session when refresh fails after token expiry", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/orders",
        search: "?status=PLACED",
        href: "http://localhost/orders?status=PLACED",
        origin: "http://localhost",
        assign
      }
    });

    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Access token has expired.",
            status: 401,
            code: "ACCESS_TOKEN_EXPIRED"
          },
          { status: 401 }
        )
      ),
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
    );

    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
    });

    await expect(apiRequest("/api/v1/me")).rejects.toThrow(/redirecting to login/i);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(assign).toHaveBeenCalledWith("/login?from=%2Forders%3Fstatus%3DPLACED");
  });

  it("does not attempt refresh for non-auth-related 401 problems", async () => {
    let refreshCalls = 0;
    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Some other 401.",
            status: 401,
            code: "SOMETHING_ELSE"
          },
          { status: 401 }
        )
      ),
      http.post("/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json({
          accessToken: "fresh-token",
          user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
        });
      })
    );

    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
    });

    await expect(apiRequest("/api/v1/me")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(0);
  });

  it("synthesizes a problem from the status when the error body is not JSON", async () => {
    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.text("<html>gateway boom</html>", {
          status: 502,
          headers: { "content-type": "text/html" }
        })
      )
    );

    const error = await apiRequest("/api/v1/me", { auth: false }).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem).toMatchObject({
      status: 502,
      code: "HTTP_502"
    });
    expect(typeof (error as ApiError).problem.title).toBe("string");
    expect((error as ApiError).problem.title.length).toBeGreaterThan(0);
  });

  it("falls back to a synthetic problem when a JSON content-type body fails to parse", async () => {
    server.use(
      http.get("/api/v1/me", () =>
        HttpResponse.text("not really json", {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      )
    );

    const error = await apiRequest("/api/v1/me", { auth: false }).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).problem).toMatchObject({
      status: 500,
      code: "HTTP_500"
    });
  });

  it("dedupes concurrent refreshes into a single /auth/refresh call", async () => {
    let refreshCalls = 0;
    const responses: ("expire" | "ok")[] = ["expire", "expire", "ok", "ok"];
    server.use(
      http.get("/api/v1/me", () => {
        const next = responses.shift();
        if (next === "expire") {
          return HttpResponse.json(
            {
              type: "about:blank",
              title: "Access token has expired.",
              status: 401,
              code: "ACCESS_TOKEN_EXPIRED"
            },
            { status: 401 }
          );
        }
        return HttpResponse.json({ ok: true });
      }),
      http.post("/api/v1/auth/refresh", async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({
          accessToken: "fresh-token",
          user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
        });
      })
    );

    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: { id: "u-1", email: "u@example.com", name: "U", role: "CUSTOMER" }
    });

    const [a, b] = await Promise.all([
      apiRequest<{ ok: true }>("/api/v1/me"),
      apiRequest<{ ok: true }>("/api/v1/me")
    ]);

    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });
});
