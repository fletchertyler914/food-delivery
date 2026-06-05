import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "../auth/auth.store";
import { useCartStore } from "../cart/cart.store";
import { RestaurantMenuPage } from "./RestaurantMenuPage";

// The public restaurant DTO intentionally does not expose `ownerId`;
// only the owner-scoped /restaurants/mine endpoint returns it. Keep
// the fixture aligned with the OpenAPI contract.
const restaurant = {
  id: "seed-rest-mizu",
  name: "Mizu Sushi House",
  description: "Edomae nigiri and seasonal omakase.",
  imageUrl: null,
  createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
};

const meals = [
  {
    id: "seed-meal-mizu-nigiri",
    restaurantId: "seed-rest-mizu",
    name: "Bluefin Tuna Nigiri (3pc)",
    description: "Sushi-grade bluefin over seasoned sushi rice.",
    priceCents: 1400,
    imageUrl: null,
    isActive: true,
    createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
  }
];

function mountMenu(): void {
  server.use(
    http.get("/api/v1/restaurants/seed-rest-mizu", () => HttpResponse.json(restaurant)),
    http.get("/api/v1/restaurants/seed-rest-mizu/meals", () => HttpResponse.json(meals))
  );

  renderWithProviders(<RestaurantMenuPage />, {
    path: "/restaurants/:restaurantId",
    route: "/restaurants/seed-rest-mizu"
  });
}

describe("RestaurantMenuPage", () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession();
    useCartStore.getState().clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders restaurant name and meals", async () => {
    mountMenu();

    expect(await screen.findByText("Mizu Sushi House")).toBeInTheDocument();
    expect(screen.getByText("Bluefin Tuna Nigiri (3pc)")).toBeInTheDocument();
    expect(screen.getByText("$14.00")).toBeInTheDocument();
  });

  it("allows anonymous visitors to add to cart", async () => {
    const user = userEvent.setup();
    mountMenu();
    await screen.findByText("Bluefin Tuna Nigiri (3pc)");

    const button = screen.getByRole("button", { name: /add bluefin tuna nigiri/i });
    expect(button).toBeEnabled();
    await user.click(button);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().restaurantId).toBe("seed-rest-mizu");
  });

  it("allows owners to add to cart", async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setSession({
      accessToken: "token",
      user: { id: "owner-1", email: "owner@example.com", name: "Owner", role: "OWNER" }
    });

    mountMenu();
    await screen.findByText("Bluefin Tuna Nigiri (3pc)");

    const button = screen.getByRole("button", { name: /add bluefin tuna nigiri/i });
    expect(button).toBeEnabled();
    await user.click(button);

    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("adds to cart for an authenticated customer", async () => {
    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER"
      }
    });

    mountMenu();
    await screen.findByText("Bluefin Tuna Nigiri (3pc)");

    const button = screen.getByRole("button", { name: /add bluefin tuna nigiri/i });
    expect(button).not.toBeDisabled();

    await userEvent.click(button);

    expect(useCartStore.getState().items).toEqual([
      {
        mealId: "seed-meal-mizu-nigiri",
        restaurantId: "seed-rest-mizu",
        name: "Bluefin Tuna Nigiri (3pc)",
        priceCents: 1400,
        quantity: 1
      }
    ]);
  });
});
