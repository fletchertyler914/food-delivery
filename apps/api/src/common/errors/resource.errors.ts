import { DomainError } from "./domain-error";

export class RestaurantNotFoundError extends DomainError {
  constructor(restaurantId: string) {
    super({
      code: "RESTAURANT_NOT_FOUND",
      message: "Restaurant not found.",
      status: 404,
      detail: `No restaurant with id ${restaurantId}.`
    });
  }
}

export class MealNotFoundError extends DomainError {
  constructor(mealId: string) {
    super({
      code: "MEAL_NOT_FOUND",
      message: "Meal not found.",
      status: 404,
      detail: `No meal with id ${mealId}.`
    });
  }
}

export class ResourceForbiddenError extends DomainError {
  constructor(detail: string) {
    super({
      code: "RESOURCE_FORBIDDEN",
      message: "You do not have permission to perform this action.",
      status: 403,
      detail
    });
  }
}
