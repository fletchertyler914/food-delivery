import "@testing-library/jest-dom/vitest";

import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { useAuthStore } from "../features/auth/auth.store";
import { useCartStore } from "../features/cart/cart.store";
import { server } from "./msw-server";

// MSW lifecycle is consolidated here so individual specs don't have to
// listen/close/resetHandlers themselves. `onUnhandledRequest: "error"`
// makes it loud when a component fires a request that no test set up.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  // Reset Zustand singletons between tests so state never leaks
  // between specs (e.g. an authenticated user from a previous test
  // bleeding into a public-page render).
  useAuthStore.getState().clearSession();
  useCartStore.getState().clear();
});

afterAll(() => {
  server.close();
});

// jsdom's default `Location` URL is "about:blank", which makes fetch
// reject every relative-path request that MSW would otherwise
// intercept. Pin the test origin so the SPA's relative URLs ("/api/…")
// parse correctly.
beforeEach(() => {
  if (typeof window !== "undefined" && window.location.href === "about:blank") {
    window.history.replaceState(null, "", "http://localhost/");
  }
});
