import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthResponse, AuthUser } from "../../lib/api/types";

// Cookie-based auth: only the short-lived access token + the
// authenticated user are kept in memory. Refresh happens transparently
// through the browser cookie attached to /api/v1/auth/refresh, so the
// SPA never sees or stores the long-lived secret.
interface AuthState {
  readonly accessToken: string | null;
  readonly user: AuthUser | null;
  setSession: (session: AuthResponse) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (session) => {
        set({ accessToken: session.accessToken, user: session.user });
      },
      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      clearSession: () => {
        set({ accessToken: null, user: null });
      }
    }),
    {
      name: "food-delivery-auth",
      // Only the user identity survives a reload — the access token
      // is re-issued by /auth/refresh on demand. Refresh tokens never
      // touch localStorage.
      partialize: (state) => ({ user: state.user })
    }
  )
);

// Route loaders can run before Zustand finishes reading localStorage.
// Session bootstrap must wait for hydration so a persisted user is
// visible before we decide whether to clear a stale identity.
export function awaitAuthStoreHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}
