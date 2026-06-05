import { DomainError } from "../../../common/errors/domain-error";
import { addCents, cents, discountCents, type Cents } from "./money";

export interface PriceLineItem {
  readonly priceCents: Cents;
  readonly quantity: number;
}

export interface PricingInput {
  readonly items: readonly PriceLineItem[];
  readonly tipCents: Cents;
  readonly couponPercentOff?: number;
}

export interface PricingResult {
  readonly subtotalCents: Cents;
  readonly discountCents: Cents;
  readonly totalCents: Cents;
}

export class EmptyOrderError extends DomainError {
  constructor() {
    super({
      code: "INVALID_PRICING_INPUT",
      message: "An order must contain at least one item.",
      status: 400
    });
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(detail: string) {
    super({
      code: "INVALID_PRICING_INPUT",
      message: "Order item quantity must be a positive integer.",
      status: 400,
      detail
    });
  }
}

export function computePricing(input: PricingInput): PricingResult {
  if (input.items.length === 0) {
    throw new EmptyOrderError();
  }

  // Validate tip up-front so a negative tip is rejected even if the
  // subsequent total accidentally lands non-negative (e.g. when the
  // subtotal absorbs the negative). `cents()` enforces non-negative
  // integers and throws `InvalidCentsError` otherwise.
  const validatedTip = cents(input.tipCents);

  const lineTotals = input.items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new InvalidQuantityError(`Received ${String(item.quantity)}.`);
    }

    return cents(item.priceCents * item.quantity);
  });

  const subtotal = addCents(lineTotals);
  const discount = discountCents(subtotal, input.couponPercentOff ?? 0);
  const total = cents(subtotal - discount + validatedTip);

  return {
    subtotalCents: subtotal,
    discountCents: discount,
    totalCents: total
  };
}
