import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { paths } from "../../app/paths";
import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "../auth/auth.store";
import { useCartStore } from "./cart.store";
import { useCheckoutStore } from "./checkout.store";
import { CartPage } from "./CartPage";

describe("CartPage", () => {
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
    localStorage.removeItem("food-delivery-checkout");
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
    useCartStore.setState({ restaurantId: null, items: [] });
    useCheckoutStore.getState().clear();
    localStorage.removeItem("food-delivery-cart");
    localStorage.removeItem("food-delivery-checkout");
    cleanup();
  });

  it("links signed-in users to checkout", async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    renderWithProviders(<CartPage />);

    const checkoutLink = screen.getByRole("link", { name: /continue to checkout/i });
    expect(checkoutLink).toHaveAttribute("href", paths.checkout);
    await user.click(checkoutLink);
  });

  it("links anonymous users to login with a checkout return path", () => {
    useAuthStore.getState().clearSession();
    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    renderWithProviders(<CartPage />);

    const checkoutLink = screen.getByRole("link", { name: /continue to checkout/i });
    expect(checkoutLink).toHaveAttribute(
      "href",
      `${paths.login}?from=${encodeURIComponent(paths.checkout)}`
    );
    expect(screen.getByText(/you'll sign in to confirm payment/i)).toBeInTheDocument();
  });

  it("applies a valid coupon and previews the discount in the summary", async () => {
    const user = userEvent.setup();
    let previewedCode: string | null = null;
    server.use(
      http.get("/api/v1/restaurants/restaurant-1/coupons/preview", ({ request }) => {
        previewedCode = new URL(request.url).searchParams.get("code");
        return HttpResponse.json({ code: "SAVE10", percentOff: 10 });
      })
    );

    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_000
    });

    renderWithProviders(<CartPage />);

    await user.type(screen.getByLabelText(/coupon code/i), "save10");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(useCheckoutStore.getState().appliedCoupon).toEqual({ code: "SAVE10", percentOff: 10 });
    });
    expect(previewedCode).toBe("SAVE10");
    // 10% off $10.00 = $1.00 discount shown in the order summary.
    expect(await screen.findByText("−$1.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^remove$/i })).toBeInTheDocument();
  });

  it("surfaces an error when the coupon is rejected", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v1/restaurants/restaurant-1/coupons/preview", () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Coupon not found.",
            status: 404,
            code: "COUPON_NOT_FOUND"
          },
          { status: 404, headers: { "content-type": "application/problem+json" } }
        )
      )
    );

    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_000
    });

    renderWithProviders(<CartPage />);

    await user.type(screen.getByLabelText(/coupon code/i), "nope99");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() => {
      expect(screen.getByText(/coupon not found/i)).toBeInTheDocument();
    });
    expect(useCheckoutStore.getState().appliedCoupon).toBeNull();
  });
});
