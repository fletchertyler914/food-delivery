import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../features/auth/auth.store";
import { server } from "../test/msw-server";
import { bootstrapAuth, resetAuthBootstrapForTesting } from "./auth-bootstrap";

describe("bootstrapAuth", () => {
  beforeEach(() => {
    resetAuthBootstrapForTesting();
    useAuthStore.getState().clearSession();
  });

  afterEach(() => {
    resetAuthBootstrapForTesting();
  });

  it("populates the auth store when the refresh cookie is valid", async () => {
    server.use(
      http.post("/api/v1/auth/refresh", () =>
        HttpResponse.json({
          accessToken: "fresh-access",
          user: {
            id: "user-1",
            email: "customer@example.com",
            name: "Customer",
            role: "CUSTOMER"
          }
        })
      )
    );

    await bootstrapAuth();

    expect(useAuthStore.getState().accessToken).toBe("fresh-access");
    expect(useAuthStore.getState().user?.email).toBe("customer@example.com");
  });

  it("clears any stale persisted user when the refresh cookie is missing or revoked", async () => {
    useAuthStore.getState().setSession({
      accessToken: "stale-token",
      user: { id: "user-1", email: "old@example.com", name: "Old", role: "CUSTOMER" }
    });
    // Simulate a hard refresh — only the persisted user survived.
    useAuthStore.setState({ accessToken: null });

    await bootstrapAuth();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("dedupes concurrent calls so only one /auth/refresh request is fired", async () => {
    let calls = 0;
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        calls += 1;
        return HttpResponse.json({
          accessToken: "fresh-access",
          user: { id: "user-1", email: "c@example.com", name: "C", role: "CUSTOMER" }
        });
      })
    );

    await Promise.all([bootstrapAuth(), bootstrapAuth(), bootstrapAuth()]);

    expect(calls).toBe(1);
  });

  it("is a no-op when the access token is already in memory", async () => {
    useAuthStore.getState().setSession({
      accessToken: "in-memory",
      user: { id: "user-1", email: "c@example.com", name: "C", role: "CUSTOMER" }
    });
    let calls = 0;
    server.use(
      http.post("/api/v1/auth/refresh", () => {
        calls += 1;
        return HttpResponse.json({}, { status: 500 });
      })
    );

    await bootstrapAuth();

    expect(calls).toBe(0);
    expect(useAuthStore.getState().accessToken).toBe("in-memory");
  });
});
