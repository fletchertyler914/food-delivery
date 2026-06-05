export type DomainErrorCode =
  | "ACCESS_TOKEN_EXPIRED"
  | "INVALID_BEARER"
  | "REGISTRATION_FAILED"
  | "COUPON_CODE_TAKEN"
  | "COUPON_INACTIVE"
  | "COUPON_NOT_FOR_RESTAURANT"
  | "COUPON_NOT_FOUND"
  | "CUSTOMER_BLOCKED"
  | "EMAIL_TAKEN"
  | "INVALID_BLOCK_TARGET"
  | "NO_CUSTOMER_RELATIONSHIP"
  | "BLOCK_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "INVALID_ORDER_RESTAURANT"
  | "INVALID_PRICING_INPUT"
  | "INVALID_REFRESH_TOKEN"
  | "INVALID_STATUS_TRANSITION"
  | "INVALID_TOKEN_LOOKUP"
  | "MEAL_INACTIVE"
  | "MEAL_NOT_FOUND"
  | "ORDER_NOT_COMPLETE"
  | "ORDER_NOT_FOUND"
  | "RESOURCE_FORBIDDEN"
  | "RESTAURANT_NOT_FOUND"
  | "WEAK_PASSWORD";

export interface DomainErrorOptions {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly status: number;
  readonly detail?: string;
  readonly cause?: unknown;
}

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly status: number;
  readonly detail: string | undefined;

  constructor(options: DomainErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status;
    this.detail = options.detail;
  }
}
