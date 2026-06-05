import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  readonly mealId: string;
  readonly restaurantId: string;
  readonly name: string;
  readonly priceCents: number;
  readonly quantity: number;
}

// Quantity is bounded at the store level so neither buggy callers nor
// keyboard-pasted text fields can push absurd values into the cart.
// 1..999 is wide enough for any realistic order while still protecting
// downstream price math from overflow.
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 999;

export interface CartState {
  readonly restaurantId: string | null;
  readonly items: readonly CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  setQuantity: (mealId: string, quantity: number) => void;
  removeItem: (mealId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      items: [],
      addItem: (item) => {
        const currentRestaurantId = get().restaurantId;

        // Cross-restaurant adds replace the cart wholesale. The
        // restaurant-switch confirmation lives in the page that
        // initiates the add — by the time we land here the user has
        // already approved the swap.
        if (currentRestaurantId && currentRestaurantId !== item.restaurantId) {
          set({
            restaurantId: item.restaurantId,
            items: [{ ...item, quantity: MIN_QUANTITY }]
          });
          return;
        }

        set((state) => ({
          restaurantId: item.restaurantId,
          items: upsertItem(state.items, item)
        }));
      },
      setQuantity: (mealId, quantity) => {
        const next = clampQuantity(quantity);
        set((state) => ({
          items: state.items.map((cartItem) =>
            cartItem.mealId === mealId ? { ...cartItem, quantity: next } : cartItem
          )
        }));
      },
      removeItem: (mealId) => {
        set((state) => {
          const items = state.items.filter((cartItem) => cartItem.mealId !== mealId);
          return {
            items,
            // Keep restaurantId in sync so the next add isn't treated
            // as a "switch" when the user just emptied the cart.
            restaurantId: items.length === 0 ? null : state.restaurantId
          };
        });
      },
      clear: () => {
        set({ restaurantId: null, items: [] });
      }
    }),
    {
      name: "food-delivery-cart",
      // Only persist the data that actually represents the cart; the
      // action functions are recreated by zustand on each load.
      partialize: (state) => ({
        restaurantId: state.restaurantId,
        items: state.items
      })
    }
  )
);

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return MIN_QUANTITY;
  }
  const rounded = Math.floor(quantity);
  if (rounded < MIN_QUANTITY) {
    return MIN_QUANTITY;
  }
  if (rounded > MAX_QUANTITY) {
    return MAX_QUANTITY;
  }
  return rounded;
}

function upsertItem(
  items: readonly CartItem[],
  item: Omit<CartItem, "quantity">
): readonly CartItem[] {
  const existing = items.find((cartItem) => cartItem.mealId === item.mealId);

  if (!existing) {
    return [...items, { ...item, quantity: MIN_QUANTITY }];
  }

  return items.map((cartItem) =>
    cartItem.mealId === item.mealId
      ? { ...cartItem, quantity: clampQuantity(cartItem.quantity + 1) }
      : cartItem
  );
}
