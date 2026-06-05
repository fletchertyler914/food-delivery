import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { paths } from "../../app/paths";
import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "../auth/auth.store";
import { useCheckoutStore } from "./checkout.store";
import { useCartStore } from "./cart.store";
import { CheckoutPage } from "./CheckoutPage";

describe("CheckoutPage", () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({
      accessToken: "token",
      user: {
        id: "customer-1",
        email: "customer@example.com",
        name: "Customer",
        role: "CUSTOMER"
      }
    });
    useCartStore.setState({ restaurantId: null, items: [] });
    useCheckoutStore.getState().clear();
    localStorage.removeItem("food-delivery-cart");
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
    useCartStore.setState({ restaurantId: null, items: [] });
    useCheckoutStore.getState().clear();
    localStorage.removeItem("food-delivery-cart");
    cleanup();
  });

  it("submits custom tips as integer cents", async () => {
    let lastOrderBody: unknown = undefined;
    server.use(
      http.post("/api/v1/orders", async ({ request }) => {
        lastOrderBody = await request.json();
        return HttpResponse.json(
          {
            id: "order-1",
            customerId: "customer-1",
            restaurantId: "restaurant-1",
            restaurant: {
              id: "restaurant-1",
              name: "Kitchen",
              imageUrl: null,
              ownerId: "owner-1"
            },
            status: "PLACED",
            tipCents: 345,
            subtotalCents: 1_299,
            discountCents: 0,
            totalCents: 1_644,
            items: [],
            placedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { status: 201 }
        );
      })
    );

    const user = userEvent.setup();
    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    useCheckoutStore.getState().setCustomTipCents(345);

    renderWithProviders(<CheckoutPage />, {
      route: paths.checkout,
      path: paths.checkout,
      extraRoutes: [{ path: paths.order("order-1"), element: <div>Order detail</div> }]
    });

    // Card fields are prefilled with the demo card; just submit.
    await user.click(screen.getByRole("button", { name: /pay/i }));

    await waitFor(() => {
      expect(lastOrderBody).toMatchObject({ restaurantId: "restaurant-1", tipCents: 345 });
    });
  });
});
