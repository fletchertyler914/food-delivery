import type {
  CreateMealInput,
  CreateRestaurantInput,
  Meal,
  OwnerRestaurant,
  Restaurant,
  UpdateMealInput
} from "./types";
import { apiRequest } from "./client";

interface PaginatedEnvelope<T> {
  readonly data: T[];
  readonly nextCursor?: string;
}

// List endpoints return a `{ data, nextCursor }` envelope. The
// helpers below unwrap it to keep page-level callers ergonomic; full
// pagination support is reintroduced via `*Page` variants when the
// UI needs it. We still accept a bare array for resilience against
// older API revisions and the new `/mine` endpoint.
function unwrap<T>(response: T[] | PaginatedEnvelope<T>): T[] {
  return Array.isArray(response) ? response : response.data;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const response = await apiRequest<Restaurant[] | PaginatedEnvelope<Restaurant>>(
    "/api/v1/restaurants",
    { auth: false }
  );
  return unwrap(response);
}

// Owner-scoped listing: hits the dedicated /restaurants/mine endpoint
// instead of filtering the public catalog by ownerId. The response
// payload also includes `ownerId`, which the public DTO no longer
// exposes.
export async function listMyRestaurants(): Promise<OwnerRestaurant[]> {
  const response = await apiRequest<OwnerRestaurant[] | PaginatedEnvelope<OwnerRestaurant>>(
    "/api/v1/restaurants/mine"
  );
  return unwrap(response);
}

export function getRestaurant(id: string): Promise<Restaurant> {
  return apiRequest<Restaurant>(`/api/v1/restaurants/${id}`, { auth: false });
}

export function createRestaurant(input: CreateRestaurantInput): Promise<OwnerRestaurant> {
  return apiRequest<OwnerRestaurant>("/api/v1/restaurants", {
    method: "POST",
    body: input
  });
}

export async function listActiveMeals(restaurantId: string): Promise<Meal[]> {
  const response = await apiRequest<Meal[] | PaginatedEnvelope<Meal>>(
    `/api/v1/restaurants/${restaurantId}/meals`,
    { auth: false }
  );
  return unwrap(response);
}

export async function listAllMealsForOwner(restaurantId: string): Promise<Meal[]> {
  const response = await apiRequest<Meal[] | PaginatedEnvelope<Meal>>(
    `/api/v1/restaurants/${restaurantId}/meals/all`
  );
  return unwrap(response);
}

export function getMeal(id: string): Promise<Meal> {
  return apiRequest<Meal>(`/api/v1/meals/${id}`, { auth: false });
}

export function createMeal(restaurantId: string, input: CreateMealInput): Promise<Meal> {
  return apiRequest<Meal>(`/api/v1/restaurants/${restaurantId}/meals`, {
    method: "POST",
    body: input
  });
}

export function updateMeal(id: string, input: UpdateMealInput): Promise<Meal> {
  return apiRequest<Meal>(`/api/v1/meals/${id}`, {
    method: "PATCH",
    body: input
  });
}

export function deactivateMeal(id: string): Promise<undefined> {
  return apiRequest<undefined>(`/api/v1/meals/${id}`, {
    method: "DELETE"
  });
}

export function reactivateMeal(id: string): Promise<Meal> {
  return apiRequest<Meal>(`/api/v1/meals/${id}/reactivate`, {
    method: "POST"
  });
}
