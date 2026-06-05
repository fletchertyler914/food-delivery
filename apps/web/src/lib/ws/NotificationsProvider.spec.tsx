import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { SnackbarProvider } from "notistack";
import type * as Notistack from "notistack";
import type { PropsWithChildren, ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../../features/auth/auth.store";
import { NotificationsProvider } from "./NotificationsProvider";

const socketHandlers = new Map<string, (payload: unknown) => void>();
const disconnect = vi.fn();
const enqueueSnackbar = vi.fn();

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: (eventName: string, handler: (payload: unknown) => void) => {
      socketHandlers.set(eventName, handler);
    },
    disconnect
  }))
}));

vi.mock("notistack", async () => {
  const actual = await vi.importActual<typeof Notistack>("notistack");
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar,
      closeSnackbar: vi.fn()
    })
  };
});

describe("NotificationsProvider", () => {
  afterEach(() => {
    socketHandlers.clear();
    disconnect.mockClear();
    enqueueSnackbar.mockClear();
    useAuthStore.getState().clearSession();
  });

  it("invalidates order queries and toasts when a different actor changes status", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    useAuthStore.getState().setSession({
      accessToken: "access-token",
      user: { id: "user-1", email: "user@example.com", name: "User", role: "CUSTOMER" }
    });

    render(
      <NotificationsProvider>
        <div>child</div>
      </NotificationsProvider>,
      { wrapper: makeWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(socketHandlers.has("order.status_changed")).toBe(true);
    });

    socketHandlers.get("order.status_changed")?.({
      orderId: "order-1",
      toStatus: "PROCESSING",
      actorId: "owner-1"
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["orders"] });
    });
    expect(enqueueSnackbar).toHaveBeenCalledWith(expect.stringContaining("is now Preparing"), {
      variant: "info"
    });
  });

  it("does not toast the actor on order.status_changed they triggered themselves", async () => {
    // The mutation's onSuccess handler already shows a confirmation
    // toast ("Order is now Canceled"). The realtime echo of the
    // actor's own action would be a redundant second toast.
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    useAuthStore.getState().setSession({
      accessToken: "access-token",
      user: { id: "customer-1", email: "customer@example.com", name: "Customer", role: "CUSTOMER" }
    });

    render(
      <NotificationsProvider>
        <div>child</div>
      </NotificationsProvider>,
      { wrapper: makeWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(socketHandlers.has("order.status_changed")).toBe(true);
    });

    socketHandlers.get("order.status_changed")?.({
      orderId: "order-1",
      toStatus: "CANCELED",
      actorId: "customer-1"
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["orders"] });
    });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it("does not toast customers on order.created but still refreshes their orders cache", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    useAuthStore.getState().setSession({
      accessToken: "access-token",
      user: { id: "customer-1", email: "customer@example.com", name: "Customer", role: "CUSTOMER" }
    });

    render(
      <NotificationsProvider>
        <div>child</div>
      </NotificationsProvider>,
      { wrapper: makeWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(socketHandlers.has("order.created")).toBe(true);
    });

    socketHandlers.get("order.created")?.({
      orderId: "order-1",
      customerId: "customer-1",
      restaurantId: "restaurant-1",
      status: "PLACED"
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["orders"] });
    });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it("toasts owners on order.created from a different customer", async () => {
    const queryClient = new QueryClient();
    useAuthStore.getState().setSession({
      accessToken: "access-token",
      user: { id: "owner-1", email: "owner@example.com", name: "Owner", role: "OWNER" }
    });

    render(
      <NotificationsProvider>
        <div>child</div>
      </NotificationsProvider>,
      { wrapper: makeWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(socketHandlers.has("order.created")).toBe(true);
    });

    socketHandlers.get("order.created")?.({
      orderId: "order-1",
      customerId: "customer-9",
      restaurantId: "restaurant-1",
      status: "PLACED"
    });

    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalledWith("A new order just came in", {
        variant: "success"
      });
    });
  });

  it("does not toast owners when the order is one they placed themselves", async () => {
    // An owner buying from any restaurant (their own included) is
    // acting as a customer; the checkout flow already shows them
    // an "Order placed" confirmation. The kitchen-side ping would
    // be confusing on top of that.
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    useAuthStore.getState().setSession({
      accessToken: "access-token",
      user: { id: "owner-1", email: "owner@example.com", name: "Owner", role: "OWNER" }
    });

    render(
      <NotificationsProvider>
        <div>child</div>
      </NotificationsProvider>,
      { wrapper: makeWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(socketHandlers.has("order.created")).toBe(true);
    });

    socketHandlers.get("order.created")?.({
      orderId: "order-1",
      customerId: "owner-1",
      restaurantId: "restaurant-1",
      status: "PLACED"
    });

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["orders"] });
    });
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });
});

function makeWrapper(queryClient: QueryClient): (props: PropsWithChildren) => ReactElement {
  return function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <SnackbarProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SnackbarProvider>
    );
  };
}
