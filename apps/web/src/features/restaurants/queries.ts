import { queryOptions } from "@tanstack/react-query";

import {
  getMeal,
  getRestaurant,
  listActiveMeals,
  listAllMealsForOwner,
  listRestaurants
} from "../../lib/api/restaurants.api";

// Restaurants and menus rarely change between page transitions; a 5
// minute window keeps navigations instant while still reflecting owner
// edits on the next focus/return. Owner-managed views opt out below
// because the dashboard mutates them and expects fresh reads.
const RESTAURANT_STALE_MS = 5 * 60 * 1000;

export const restaurantsKeys = {
  all: () => ["restaurants"] as const,
  list: () => ["restaurants"] as const,
  detail: (id: string) => ["restaurants", id] as const,
  publicMenu: (restaurantId: string) => ["restaurants", restaurantId, "meals"] as const,
  ownerMenu: (restaurantId: string) => ["restaurants", restaurantId, "meals", "all"] as const,
  meal: (mealId: string) => ["meals", mealId] as const
};

export function restaurantsQuery() {
  return queryOptions({
    queryKey: restaurantsKeys.list(),
    queryFn: () => listRestaurants(),
    staleTime: RESTAURANT_STALE_MS
  });
}

export function restaurantQuery(id: string) {
  return queryOptions({
    queryKey: restaurantsKeys.detail(id),
    queryFn: () => getRestaurant(id),
    enabled: id.length > 0,
    staleTime: RESTAURANT_STALE_MS
  });
}

export function publicMenuQuery(restaurantId: string) {
  return queryOptions({
    queryKey: restaurantsKeys.publicMenu(restaurantId),
    queryFn: () => listActiveMeals(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: RESTAURANT_STALE_MS
  });
}

export function ownerMenuQuery(restaurantId: string) {
  return queryOptions({
    queryKey: restaurantsKeys.ownerMenu(restaurantId),
    queryFn: () => listAllMealsForOwner(restaurantId),
    enabled: restaurantId.length > 0,
    // Owner is actively mutating these — never serve stale data.
    staleTime: 0
  });
}

export function mealQuery(mealId: string) {
  return queryOptions({
    queryKey: restaurantsKeys.meal(mealId),
    queryFn: () => getMeal(mealId),
    enabled: mealId.length > 0,
    staleTime: RESTAURANT_STALE_MS
  });
}
