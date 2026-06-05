import { useCallback, useState } from "react";

import { useCartStore, type CartItem } from "./cart.store";

export type AddToCartGate = "allowed" | "inactive";

interface UseAddToCart {
  readonly pendingItem: Omit<CartItem, "quantity"> | null;
  readonly tryAddItem: (
    item: Omit<CartItem, "quantity">
  ) => "added" | "needs-confirmation" | "blocked";
  readonly confirmReplace: () => void;
  readonly cancelReplace: () => void;
  readonly gate: AddToCartGate;
  readonly disabled: boolean;
  readonly buttonLabel: string;
}

// Centralizes cross-restaurant cart gates. Pages call `tryAddItem`, and
// if the return value is "needs-confirmation" render a dialog that
// defers to `confirmReplace` / `cancelReplace`.
export function useAddToCart(options?: { readonly mealIsActive?: boolean }): UseAddToCart {
  const addItem = useCartStore((state) => state.addItem);
  const [pendingItem, setPendingItem] = useState<Omit<CartItem, "quantity"> | null>(null);

  const mealIsActive = options?.mealIsActive ?? true;
  const gate: AddToCartGate = mealIsActive ? "allowed" : "inactive";

  const tryAddItem = useCallback(
    (item: Omit<CartItem, "quantity">): "added" | "needs-confirmation" | "blocked" => {
      if (gate !== "allowed") {
        return "blocked";
      }
      const currentRestaurantId = useCartStore.getState().restaurantId;
      const currentItems = useCartStore.getState().items;

      if (
        currentRestaurantId &&
        currentRestaurantId !== item.restaurantId &&
        currentItems.length > 0
      ) {
        setPendingItem(item);
        return "needs-confirmation";
      }

      addItem(item);
      return "added";
    },
    [addItem, gate]
  );

  const confirmReplace = useCallback(() => {
    if (!pendingItem) {
      return;
    }
    addItem(pendingItem);
    setPendingItem(null);
  }, [addItem, pendingItem]);

  const cancelReplace = useCallback(() => {
    setPendingItem(null);
  }, []);

  return {
    pendingItem,
    tryAddItem,
    confirmReplace,
    cancelReplace,
    gate,
    disabled: gate !== "allowed",
    buttonLabel: gate === "inactive" ? "Unavailable" : "Add to cart"
  };
}
