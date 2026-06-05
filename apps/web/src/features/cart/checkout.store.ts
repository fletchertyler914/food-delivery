import { create } from "zustand";
import { persist } from "zustand/middleware";

export const TIP_PERCENT_PRESETS = [12, 15, 18] as const;

export const DEFAULT_TIP_PERCENT = 15;

// A tip is either a percentage of the order subtotal (the presets) or a
// custom absolute amount in integer cents. Percentage tips intentionally
// track the subtotal so changing quantities keeps the tip proportional.
export type TipSelection =
  | { readonly kind: "percent"; readonly percent: number }
  | { readonly kind: "custom"; readonly cents: number };

const DEFAULT_TIP: TipSelection = { kind: "percent", percent: DEFAULT_TIP_PERCENT };

// A coupon that has been validated against the API. We keep `percentOff`
// alongside the code so the cart/checkout summaries can preview the
// discount locally (using the same integer-cents math as the server)
// without a round-trip on every quantity change.
export interface AppliedCoupon {
  readonly code: string;
  readonly percentOff: number;
}

export interface CheckoutState {
  readonly tip: TipSelection;
  // The raw text in the coupon input (the draft the user is typing).
  readonly couponCode: string;
  // The coupon that has actually been validated and applied, if any.
  readonly appliedCoupon: AppliedCoupon | null;
  setTipPercent: (percent: number) => void;
  setCustomTipCents: (cents: number) => void;
  setCouponCode: (couponCode: string) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  clear: () => void;
}

// Persisted alongside the cart (see cart.store.ts). The cart survives a
// full page reload via localStorage, so the tip and coupon must too —
// otherwise a coupon typed on the cart page is silently dropped on any
// reload (refresh, or the 401 -> /login hard redirect) and never reaches
// the order request, making the coupon appear to do nothing.
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      tip: DEFAULT_TIP,
      couponCode: "",
      appliedCoupon: null,
      setTipPercent: (percent) => {
        set({ tip: { kind: "percent", percent } });
      },
      setCustomTipCents: (cents) => {
        set({ tip: { kind: "custom", cents } });
      },
      setCouponCode: (couponCode) => {
        // Editing the field invalidates any previously applied coupon
        // whose code no longer matches, so the summary can't show a
        // discount for a code that isn't in the box anymore.
        set((state) => ({
          couponCode,
          appliedCoupon:
            state.appliedCoupon?.code === couponCode.trim().toUpperCase()
              ? state.appliedCoupon
              : null
        }));
      },
      applyCoupon: (coupon) => {
        set({ couponCode: coupon.code, appliedCoupon: coupon });
      },
      removeCoupon: () => {
        set({ couponCode: "", appliedCoupon: null });
      },
      clear: () => {
        set({ tip: DEFAULT_TIP, couponCode: "", appliedCoupon: null });
      }
    }),
    {
      name: "food-delivery-checkout",
      partialize: (state) => ({
        tip: state.tip,
        couponCode: state.couponCode,
        appliedCoupon: state.appliedCoupon
      })
    }
  )
);

// Resolve the selected tip to integer cents for a given subtotal. Money
// stays integer cents end-to-end, so the percentage path rounds.
export function resolveTipCents(tip: TipSelection, subtotalCents: number): number {
  if (tip.kind === "custom") {
    return tip.cents;
  }
  return Math.round((subtotalCents * tip.percent) / 100);
}

// Mirror of the API's discountCents() (apps/api .../domain/money.ts):
// floor(subtotal * percentOff / 100). The server stays the source of
// truth — this is a UX preview only — but keeping the same rounding
// means the previewed total matches the placed order to the cent.
export function resolveDiscountCents(
  appliedCoupon: AppliedCoupon | null,
  subtotalCents: number
): number {
  if (!appliedCoupon) {
    return 0;
  }
  return Math.floor((subtotalCents * appliedCoupon.percentOff) / 100);
}
