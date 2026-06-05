import { z } from "zod";

// Re-export the canonical money helpers so existing owner imports keep
// working. The actual implementation lives in `lib/format/currency.ts`
// so customer-facing screens (Cart, Checkout) can share it too.
export { centsToDollars, dollarsToCents } from "../../lib/format/currency";

const httpsImageUrl = z
  .url("Enter a valid https URL.")
  .refine((value) => value.startsWith("https://"), "Enter a valid https URL.");

export const restaurantSchema = z.object({
  name: z.string().min(1, "Tell us your restaurant's name."),
  description: z.string().min(1, "Add a short description customers will read."),
  imageUrl: z.union([httpsImageUrl, z.literal("")]).optional()
});

export type RestaurantFormValues = z.infer<typeof restaurantSchema>;

const DOLLAR_PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
const MAX_DOLLARS = 99_999;

export const mealSchema = z.object({
  name: z.string().min(1, "Give this meal a name."),
  description: z.string().min(1, "Add a short description customers will read."),
  price: z
    .string()
    .trim()
    .min(1, "Set a price — even a penny works.")
    .regex(DOLLAR_PRICE_PATTERN, "Enter a valid price like 12.99.")
    .refine((value) => {
      const wholePart = value.split(".")[0] ?? "0";
      return Number.parseInt(wholePart, 10) <= MAX_DOLLARS;
    }, "Price is too high."),
  imageUrl: z.union([httpsImageUrl, z.literal("")]).optional()
});

export type MealFormValues = z.infer<typeof mealSchema>;

// Mirrors the API's CreateCouponDto exactly: code is uppercase
// alphanumeric (with optional - or _), 3..32 chars; percentOff is an
// integer 1..100. The transform uppercases the code before submit so
// users can type lowercase but the API still receives canonical form.
export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon codes need at least 3 characters.")
    .max(32, "Coupon codes can be at most 32 characters.")
    .transform((value) => value.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9_-]+$/, "Only A–Z, 0–9, hyphen, and underscore.")),
  percentOff: z
    .number()
    .int()
    .min(1, "Percent off must be at least 1.")
    .max(100, "Percent off must be at most 100.")
});

export type CouponFormValues = z.infer<typeof couponSchema>;
