import { DomainError } from "./domain-error";

export class CouponNotFoundError extends DomainError {
  constructor(detail: string) {
    super({
      code: "COUPON_NOT_FOUND",
      message: "Coupon not found.",
      status: 404,
      detail
    });
  }
}

export class CouponCodeTakenError extends DomainError {
  constructor(code: string) {
    super({
      code: "COUPON_CODE_TAKEN",
      message: "A coupon with this code already exists for the restaurant.",
      status: 409,
      detail: `Code: ${code}`
    });
  }
}

export class CouponInactiveError extends DomainError {
  constructor(code: string) {
    super({
      code: "COUPON_INACTIVE",
      message: "This coupon is no longer active.",
      status: 400,
      detail: `Code: ${code}`
    });
  }
}
