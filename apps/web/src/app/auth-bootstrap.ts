import { awaitAuthStoreHydration, useAuthStore } from "../features/auth/auth.store";
import { refreshSession } from "../lib/api/auth.api";

// Single source of truth for restoring a session from the httponly
// refresh cookie. Called once at app boot from <AuthBootstrap/> and
// awaited by every loader that needs to know the auth state. The
// promise is cached so concurrent callers (parallel route loaders,
// the boot-time effect, an anonymous-route check that races them) all
// see the same outcome and the API only sees one /auth/refresh call.
let bootstrapPromise: Promise<void> | null = null;

export function bootstrapAuth(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    await awaitAuthStoreHydration();

    if (useAuthStore.getState().accessToken) {
      return;
    }

    try {
      const session = await refreshSession();
      useAuthStore.getState().setSession(session);
    } catch {
      // No valid refresh cookie (most cold loads). Make sure any
      // stale persisted user is cleared so the header doesn't claim
      // a session that the API has already revoked.
      useAuthStore.getState().clearSession();
    }
  })();

  return bootstrapPromise;
}

// Used by tests to start each case from a clean slate.
export function resetAuthBootstrapForTesting(): void {
  bootstrapPromise = null;
}
