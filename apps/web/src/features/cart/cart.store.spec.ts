import { beforeEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../auth/auth.store";
import { MAX_QUANTITY, MIN_QUANTITY, useCartStore } from "./cart.store";

function reset(): void {
  useAuthStore.getState().clearSession();
  useCartStore.setState({ restaurantId: null, items: [] });
  localStorage.removeItem("food-delivery-cart");
}

function authenticateCustomer(): void {
  useAuthStore.getState().setSession({
    accessToken: "token",
    user: {
      id: "customer-1",
      email: "customer@example.com",
      name: "Customer",
      role: "CUSTOMER"
    }
  });
}

function authenticateOwner(): void {
  useAuthStore.getState().setSession({
    accessToken: "token",
    user: {
      id: "owner-1",
      email: "owner@example.com",
      name: "Owner",
      role: "OWNER"
    }
  });
}

describe("cart.store", () => {
  beforeEach(() => {
    reset();
  });

  it("adds a new item at quantity 1 with the restaurant scoped", () => {
    useCartStore.getState().addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    const state = useCartStore.getState();
    expect(state.restaurantId).toBe("restaurant-1");
    expect(state.items).toEqual([
      {
        mealId: "meal-1",
        restaurantId: "restaurant-1",
        name: "Burger",
        priceCents: 1_299,
        quantity: 1
      }
    ]);
  });

  it("increments quantity when the same meal is added again", () => {
    const store = useCartStore.getState();
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });

  it("replaces the cart when adding from a different restaurant", () => {
    const store = useCartStore.getState();
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    store.addItem({
      mealId: "meal-2",
      restaurantId: "restaurant-2",
      name: "Pizza",
      priceCents: 1_799
    });

    const state = useCartStore.getState();
    expect(state.restaurantId).toBe("restaurant-2");
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({ mealId: "meal-2", quantity: 1 });
  });

  it("clamps setQuantity to MIN_QUANTITY..MAX_QUANTITY and rounds floats", () => {
    const store = useCartStore.getState();
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    store.setQuantity("meal-1", 0);
    expect(useCartStore.getState().items[0]?.quantity).toBe(MIN_QUANTITY);

    store.setQuantity("meal-1", 5.7);
    expect(useCartStore.getState().items[0]?.quantity).toBe(5);

    store.setQuantity("meal-1", MAX_QUANTITY + 100);
    expect(useCartStore.getState().items[0]?.quantity).toBe(MAX_QUANTITY);

    store.setQuantity("meal-1", Number.NaN);
    expect(useCartStore.getState().items[0]?.quantity).toBe(MIN_QUANTITY);
  });

  it("removes an item and clears restaurantId when the cart empties", () => {
    const store = useCartStore.getState();
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    store.removeItem("meal-1");

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.restaurantId).toBeNull();
  });

  it("clear() wipes both items and restaurantId", () => {
    const store = useCartStore.getState();
    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    store.addItem({
      mealId: "meal-2",
      restaurantId: "restaurant-1",
      name: "Fries",
      priceCents: 499
    });

    store.clear();

    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.restaurantId).toBeNull();
  });

  it("allows anonymous visitors to mutate the cart", () => {
    const store = useCartStore.getState();

    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    store.setQuantity("meal-1", 3);
    store.removeItem("meal-1");
    store.clear();

    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().restaurantId).toBeNull();

    store.addItem({
      mealId: "meal-2",
      restaurantId: "restaurant-1",
      name: "Fries",
      priceCents: 499
    });
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("allows owners to mutate the cart", () => {
    authenticateOwner();
    const store = useCartStore.getState();

    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });
    store.setQuantity("meal-1", 2);

    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
  });

  it("allows customers to mutate the cart", () => {
    authenticateCustomer();
    const store = useCartStore.getState();

    store.addItem({
      mealId: "meal-1",
      restaurantId: "restaurant-1",
      name: "Burger",
      priceCents: 1_299
    });

    expect(useCartStore.getState().items).toHaveLength(1);
  });
});
