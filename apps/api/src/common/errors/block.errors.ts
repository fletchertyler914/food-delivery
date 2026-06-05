import { DomainError } from "./domain-error";

export class CustomerBlockedError extends DomainError {
  constructor() {
    super({
      code: "CUSTOMER_BLOCKED",
      message: "The restaurant owner has blocked you from placing orders.",
      status: 403
    });
  }
}

export class InvalidBlockTargetError extends DomainError {
  constructor(detail: string) {
    super({
      code: "INVALID_BLOCK_TARGET",
      message: "Only customer accounts can be blocked.",
      status: 400,
      detail
    });
  }
}

export class NoCustomerRelationshipError extends DomainError {
  constructor(detail: string) {
    super({
      code: "NO_CUSTOMER_RELATIONSHIP",
      message: "You can only block customers who have placed an order with your restaurants.",
      status: 403,
      detail
    });
  }
}

export class BlockNotFoundError extends DomainError {
  constructor(customerId: string) {
    super({
      code: "BLOCK_NOT_FOUND",
      message: "Block not found.",
      status: 404,
      detail: `No block record for customer ${customerId}.`
    });
  }
}
