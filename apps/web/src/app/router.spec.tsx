import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../features/auth/auth.store";
import type { AuthUser } from "../lib/api/types";
import { resetAuthBootstrapForTesting } from "./auth-bootstrap";
import { paths } from "./paths";
import { assertAnonymous, homeLoader, requireAuth, requireRole } from "./router";

const customer: AuthUser = {
  id: "u-customer",
  email: "customer@example.com",
  name: "Customer",
  role: "CUSTOMER"
};

const owner: AuthUser = { ...customer, id: "u-owner", email: "owner@example.com", role: "OWNER" };

function authenticate(user: AuthUser): void {
  useAuthStore.getState().setSession({ accessToken: "test-token", user });
}

function loaderArgs(path: string): { request: Request } {
  return { request: new Request(`http://localhost${path}`) };
}

// React Router's `redirect` throws a Response; capture it so the test
// can assert on the redirect target instead of bubbling the throw.
async function captureRedirect(run: () => Promise<unknown>): Promise<Response> {
  try {
    await run();
  } catch (thrown) {
    if (thrown instanceof Response) {
      return thrown;
    }
    throw thrown;
  }
  throw new Error("expected the loader to throw a redirect Response");
}

function redirectLocation(response: Response): string {
  expect(response.status).toBe(302);
  return response.headers.get("Location") ?? "";
}

describe("router loaders", () => {
  beforeEach(() => {
    resetAuthBootstrapForTesting();
    useAuthStore.getState().clearSession();
  });

  describe("requireAuth", () => {
    it("redirects anonymous users to /login with the original path as ?from", async () => {
      const response = await captureRedirect(() => requireAuth(loaderArgs("/checkout?step=2")));

      expect(redirectLocation(response)).toBe(
        `${paths.login}?from=${encodeURIComponent("/checkout?step=2")}`
      );
    });

    it("passes through for an authenticated user", async () => {
      authenticate(customer);

      await expect(requireAuth(loaderArgs("/orders"))).resolves.toBeUndefined();
    });
  });

  describe("requireRole", () => {
    it("redirects an authenticated non-owner away from owner routes", async () => {
      authenticate(customer);

      const response = await captureRedirect(() => requireRole(loaderArgs("/dashboard"), "OWNER"));

      expect(redirectLocation(response)).toBe(paths.restaurants);
    });

    it("redirects an anonymous user to /login before the role check", async () => {
      const response = await captureRedirect(() => requireRole(loaderArgs("/dashboard"), "OWNER"));

      expect(redirectLocation(response)).toBe(
        `${paths.login}?from=${encodeURIComponent("/dashboard")}`
      );
    });

    it("passes through when the user holds the required role", async () => {
      authenticate(owner);

      await expect(requireRole(loaderArgs("/dashboard"), "OWNER")).resolves.toBeUndefined();
    });
  });

  describe("assertAnonymous", () => {
    it("returns null for a signed-out visitor", async () => {
      await expect(assertAnonymous(loaderArgs("/login"))).resolves.toBeNull();
    });

    it("redirects a signed-in user to the safe ?from target", async () => {
      authenticate(customer);

      const response = await captureRedirect(() =>
        assertAnonymous(loaderArgs("/login?from=%2Forders"))
      );

      expect(redirectLocation(response)).toBe("/orders");
    });

    it("ignores a non-relative ?from and falls back to /restaurants", async () => {
      authenticate(customer);

      const response = await captureRedirect(() =>
        assertAnonymous(loaderArgs("/login?from=https://evil.example.com"))
      );

      expect(redirectLocation(response)).toBe(paths.restaurants);
    });
  });

  describe("homeLoader", () => {
    it("sends an owner to the dashboard", async () => {
      authenticate(owner);

      const response = await captureRedirect(() => homeLoader());

      expect(redirectLocation(response)).toBe(paths.dashboard);
    });

    it("sends a customer to the restaurants list", async () => {
      authenticate(customer);

      const response = await captureRedirect(() => homeLoader());

      expect(redirectLocation(response)).toBe(paths.restaurants);
    });
  });
});
