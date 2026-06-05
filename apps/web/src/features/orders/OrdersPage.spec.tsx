import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "../auth/auth.store";
import { OrdersPage } from "./OrdersPage";

const mockOrder = {
  id: "order-abc12345",
  customerId: "customer-1",
  restaurantId: "restaurant-1",
  restaurant: { id: "seed-rest-mizu", name: "Mizu Sushi House", imageUrl: null },
  couponId: null,
  status: "PLACED" as const,
  tipCents: 0,
  subtotalCents: 1000,
  discountCents: 0,
  totalCents: 1000,
  items: [
    {
      id: "item-1",
      mealId: "meal-1",
      nameSnapshot: "Burger",
      priceCentsSnapshot: 1000,
      quantity: 1
    }
  ],
  placedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("OrdersPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("links each order to its detail page", async () => {
    server.use(http.get("/api/v1/orders", () => HttpResponse.json([mockOrder])));

    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER"
      }
    });

    renderWithProviders(<OrdersPage />, { route: "/orders" });

    const link = await screen.findByRole("link", { name: /mizu sushi house/i });
    expect(link).toHaveAttribute("href", "/orders/order-abc12345");
    expect(screen.getByText("Mizu Sushi House")).toBeInTheDocument();
  });

  it("shows reorder for customers with a confirmation dialog before duplicating", async () => {
    let duplicateCalled = false;
    const completedOrder = { ...mockOrder, status: "RECEIVED" as const };
    server.use(
      http.get("/api/v1/orders", () => HttpResponse.json([completedOrder])),
      http.post("/api/v1/orders/order-abc12345/duplicate", () => {
        duplicateCalled = true;
        return HttpResponse.json(
          {
            order: { ...completedOrder, id: "order-new12345" },
            droppedMealNames: []
          },
          { status: 201 }
        );
      })
    );

    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER"
      }
    });

    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />, { route: "/orders" });

    await user.click(await screen.findByRole("button", { name: /^reorder$/i }));
    expect(screen.getByRole("dialog", { name: /reorder this order/i })).toBeInTheDocument();
    expect(duplicateCalled).toBe(false);

    await user.click(screen.getByRole("button", { name: /confirm reorder/i }));

    await waitFor(() => {
      expect(duplicateCalled).toBe(true);
    });
  });

  it("hides reorder for active customer orders", async () => {
    server.use(http.get("/api/v1/orders", () => HttpResponse.json([mockOrder])));

    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER"
      }
    });

    renderWithProviders(<OrdersPage />, { route: "/orders" });

    await screen.findByText("Mizu Sushi House");
    expect(screen.queryByRole("button", { name: /^reorder$/i })).not.toBeInTheDocument();
  });

  it("does not show reorder actions for owners", async () => {
    server.use(http.get("/api/v1/orders", () => HttpResponse.json([mockOrder])));

    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "owner-1",
        email: "owner@example.com",
        name: "Owner",
        role: "OWNER"
      }
    });

    renderWithProviders(<OrdersPage />, { route: "/orders" });

    await screen.findByText("Mizu Sushi House");
    expect(screen.queryByRole("button", { name: /^reorder$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: /order status filter/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^all$/i, selected: true })).toBeInTheDocument();
  });

  it("narrows the owner list to a single status when a status tab is selected", async () => {
    const seenStatusParams: string[][] = [];
    server.use(
      http.get("/api/v1/orders", ({ request }) => {
        const url = new URL(request.url);
        seenStatusParams.push(url.searchParams.getAll("status"));
        return HttpResponse.json([mockOrder]);
      })
    );

    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "owner-1",
        email: "owner@example.com",
        name: "Owner",
        role: "OWNER"
      }
    });

    const user = userEvent.setup();
    renderWithProviders(<OrdersPage />, { route: "/orders" });

    await screen.findByText("Mizu Sushi House");
    expect(seenStatusParams[0]).toEqual([]);

    await user.click(screen.getByRole("tab", { name: /preparing/i }));
    await waitFor(() => {
      expect(
        seenStatusParams.some((params) => params.length === 1 && params[0] === "PROCESSING")
      ).toBe(true);
    });

    await user.click(screen.getByRole("tab", { name: /out for delivery/i }));
    await waitFor(() => {
      expect(
        seenStatusParams.some((params) => params.length === 1 && params[0] === "IN_ROUTE")
      ).toBe(true);
    });

    expect(seenStatusParams.every((params) => params.length === 0 || params.length === 1)).toBe(
      true
    );
  });
});
