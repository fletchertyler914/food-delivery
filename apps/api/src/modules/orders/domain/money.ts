import { DomainError } from "../../../common/errors/domain-error";

export type Cents = number & { readonly __brand: "Cents" };

export class InvalidCentsError extends DomainError {
  constructor(detail: string) {
    super({
      code: "INVALID_PRICING_INPUT",
      message: "Currency amount is not a valid non-negative integer in cents.",
      status: 400,
      detail
    });
  }
}

export class InvalidDiscountPercentError extends DomainError {
  constructor(detail: string) {
    super({
      code: "INVALID_PRICING_INPUT",
      message: "Discount percent must be an integer from 0 to 100.",
      status: 400,
      detail
    });
  }
}

export function cents(value: number): Cents {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidCentsError(`Received ${String(value)}.`);
  }

  return value as Cents;
}

export function addCents(values: readonly Cents[]): Cents {
  return cents(values.reduce((sum, value) => sum + value, 0));
}

export function discountCents(subtotal: Cents, percentOff: number): Cents {
  if (!Number.isInteger(percentOff) || percentOff < 0 || percentOff > 100) {
    throw new InvalidDiscountPercentError(`Received ${String(percentOff)}.`);
  }

  return cents(Math.floor((subtotal * percentOff) / 100));
}
