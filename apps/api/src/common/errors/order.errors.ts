import { DomainError } from "./domain-error";

export class InvalidOrderRestaurantError extends DomainError {
  constructor() {
    super({
      code: "INVALID_ORDER_RESTAURANT",
      message: "An order can only contain meals from one restaurant.",
      status: 400
    });
  }
}

export class InvalidStatusTransitionError extends DomainError {
  constructor(detail: string) {
    super({
      code: "INVALID_STATUS_TRANSITION",
      message: "The requested order status transition is not allowed.",
      status: 409,
      detail
    });
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super({
      code: "ORDER_NOT_FOUND",
      message: "Order not found.",
      status: 404,
      detail: `No order with id ${orderId}.`
    });
  }
}

export class OrderNotCompleteError extends DomainError {
  constructor() {
    super({
      code: "ORDER_NOT_COMPLETE",
      message: "Only completed orders can be duplicated.",
      status: 409,
      detail: "Wait until the order is marked as received before reordering."
    });
  }
}

export class MealInactiveError extends DomainError {
  constructor(detail: string) {
    super({
      code: "MEAL_INACTIVE",
      message: "One or more requested meals are inactive.",
      status: 400,
      detail
    });
  }
}
