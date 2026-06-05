import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { type PropsWithChildren, type ReactElement, useEffect } from "react";
import { io, type Socket } from "socket.io-client";

import { useAuthStore } from "../../features/auth/auth.store";
import { ordersKeys } from "../../features/orders/queries";
import { refreshSession } from "../api/auth.api";
import { shortId } from "../format/datetime";
import { formatStatusLabel, type OrderStatus } from "../orders/order-status-machine";

interface OrderStatusChangedPayload {
  readonly orderId: string;
  readonly toStatus: OrderStatus;
  readonly actorId: string;
}

interface OrderCreatedPayload {
  readonly orderId: string;
  readonly customerId: string;
}

// Same-origin: nginx proxies /socket.io/ to the API. Passing "/realtime"
// tells socket.io-client to use window.location.origin and treat
// "/realtime" as the namespace.
const REALTIME_NAMESPACE = "/realtime";

export function NotificationsProvider({ children }: PropsWithChildren): ReactElement {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // Use a wrapper object so TypeScript treats the cleanup-time
    // assignment (`cancelled = true`) as visible to the connect_error
    // handler that runs after the await — bare `let cancelled = false`
    // narrows to the literal `false` inside the async closure.
    const state = { cancelled: false, isRefreshing: false };

    const socket: Socket = io(REALTIME_NAMESPACE, {
      auth: { token: accessToken },
      transports: ["websocket"]
    });

    socket.on("order.status_changed", (payload: OrderStatusChangedPayload) => {
      // Suppress the toast for the actor who triggered the change —
      // their mutation's onSuccess handler already shows a tailored
      // confirmation (e.g. `Order is now "Canceled"`). The realtime
      // ping is meant to inform the *other* party (kitchen or
      // customer) about an action they didn't initiate.
      if (payload.actorId !== userId) {
        enqueueSnackbar(
          `Order #${shortId(payload.orderId)} is now ${formatStatusLabel(payload.toStatus)}`,
          { variant: "info" }
        );
      }
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all() });
    });

    socket.on("order.created", (payload: OrderCreatedPayload) => {
      // The server fans this event out to both the customer and the
      // restaurant owner so each side's cache refreshes. The toast
      // is the kitchen-side "new order arrived" ping — only show it
      // when this user is receiving the event *as the restaurant
      // owner*, not as the customer who just placed the order. An
      // owner buying from any restaurant (their own or not) is acting
      // as a customer in that moment and gets the "Order placed"
      // confirmation from the checkout flow instead.
      const isRecipientAsOwner = role === "OWNER" && payload.customerId !== userId;
      if (isRecipientAsOwner) {
        enqueueSnackbar("A new order just came in", { variant: "success" });
      }
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all() });
    });

    // The gateway rejects expired access tokens with `connect_error`.
    // Attempt one refresh roundtrip and reconnect with the new token
    // so a stale token recovers transparently without forcing the
    // user through a full sign-in. A guard prevents the refresh from
    // looping if the refresh itself fails.
    socket.on("connect_error", (_error: Error) => {
      if (state.cancelled || state.isRefreshing) {
        return;
      }
      state.isRefreshing = true;
      void (async () => {
        try {
          const session = await refreshSession();
          if (state.cancelled) {
            return;
          }
          useAuthStore.getState().setSession(session);
          socket.auth = { token: session.accessToken };
          socket.connect();
        } catch {
          enqueueSnackbar("Live updates paused — we'll reconnect shortly.", {
            variant: "warning"
          });
        } finally {
          state.isRefreshing = false;
        }
      })();
    });

    return () => {
      state.cancelled = true;
      socket.disconnect();
    };
  }, [accessToken, enqueueSnackbar, queryClient, role, userId]);

  return <>{children}</>;
}
