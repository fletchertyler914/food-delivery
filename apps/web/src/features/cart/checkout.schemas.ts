import { z } from "zod";

export const checkoutPaymentSchema = z.object({
  nameOnCard: z.string().min(1, "Enter the name on the card."),
  cardNumber: z
    .string()
    .transform((value) => value.replaceAll(/\s/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Enter a valid card number.")),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format.")
    .refine((value) => {
      const [monthPart, yearPart] = value.split("/");
      const month = Number.parseInt(monthPart ?? "", 10);
      const year = Number.parseInt(yearPart ?? "", 10);
      if (!Number.isFinite(month) || !Number.isFinite(year)) {
        return false;
      }
      const now = new Date();
      const expiryEnd = new Date(2000 + year, month, 0, 23, 59, 59);
      return expiryEnd >= new Date(now.getFullYear(), now.getMonth(), 1);
    }, "Card has expired."),
  cvv: z.string().regex(/^\d{3,4}$/, "Enter a valid security code.")
});

export type CheckoutPaymentFormValues = z.infer<typeof checkoutPaymentSchema>;
