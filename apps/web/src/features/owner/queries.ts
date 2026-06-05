import { queryOptions } from "@tanstack/react-query";

import { listBlocks, listBlockCandidates } from "../../lib/api/blocks.api";
import { listCoupons } from "../../lib/api/coupons.api";
import { listMyRestaurants } from "../../lib/api/restaurants.api";

// Owner-scoped views are kept under their own key root so cache
// invalidations on customer-facing keys (e.g. ["restaurants"]) do not
// accidentally refetch owner data, and vice versa.
//
// staleTime is intentionally 0 across owner queries: the dashboard
// constantly mutates these resources (CRUD on restaurants/coupons,
// blocks), so we always want the next read to refetch and reflect the
// owner's most recent action.
export const ownerKeys = {
  restaurants: () => ["owner", "restaurants"] as const,
  blocks: () => ["owner", "blocks"] as const,
  blockCandidates: () => ["owner", "block-candidates"] as const,
  coupons: (restaurantId: string) => ["owner", "coupons", restaurantId] as const
};

export function ownerRestaurantsQuery() {
  return queryOptions({
    queryKey: ownerKeys.restaurants(),
    queryFn: () => listMyRestaurants(),
    staleTime: 0
  });
}

export function ownerBlocksQuery() {
  return queryOptions({
    queryKey: ownerKeys.blocks(),
    queryFn: () => listBlocks(),
    staleTime: 0
  });
}

export function ownerBlockCandidatesQuery() {
  return queryOptions({
    queryKey: ownerKeys.blockCandidates(),
    queryFn: () => listBlockCandidates(),
    staleTime: 0
  });
}

export function ownerCouponsQuery(restaurantId: string) {
  return queryOptions({
    queryKey: ownerKeys.coupons(restaurantId),
    queryFn: () => listCoupons(restaurantId),
    enabled: restaurantId.length > 0,
    staleTime: 0
  });
}
