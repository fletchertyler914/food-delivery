import type { QueryClient } from "@tanstack/react-query";

import { logout } from "../../lib/api/auth.api";
import { useCartStore } from "../cart/cart.store";
import { useCheckoutStore } from "../cart/checkout.store";
import { useAuthStore } from "./auth.store";

interface SignOutOptions {
  readonly queryClient: QueryClient;
}

// Single chokepoint for ending a session. Always clears the local
// cart and the TanStack Query cache so the next user does not see the
// previous user's data, even if the network revoke fails. Callers are
// responsible for navigation after this resolves.
export async function signOut({ queryClient }: SignOutOptions): Promise<void> {
  try {
    await logout();
  } catch {
    // Session is cleared locally even if the revoke roundtrip fails;
    // the worst case is a dangling server-side row that the next
    // login simply replaces.
  } finally {
    useAuthStore.getState().clearSession();
    useCartStore.getState().clear();
    useCheckoutStore.getState().clear();
    queryClient.clear();
  }
}
