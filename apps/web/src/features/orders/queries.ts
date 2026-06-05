import { queryOptions } from "@tanstack/react-query";

import { getOrder, getOrderEvents, listOrders } from "../../lib/api/orders.api";
import type { OrderStatus } from "../../lib/api/types";

// Orders are time-sensitive: status changes drive realtime push
// notifications, but a short staleTime still avoids burst refetches
// during quick tab switches. Realtime invalidation refreshes the cache
// the moment something actually changes server-side.
const ORDER_STALE_MS = 30 * 1000;

export interface ListOrdersQueryOptions {
  readonly restaurantId?: string;
  readonly status?: readonly OrderStatus[];
}

export const ordersKeys = {
  all: () => ["orders"] as const,
  list: (options?: ListOrdersQueryOptions) =>
    options && (options.restaurantId !== undefined || (options.status?.length ?? 0) > 0)
      ? (["orders", options] as const)
      : (["orders"] as const),
  detail: (id: string) => ["orders", id] as const,
  events: (id: string) => ["orders", id, "events"] as const
};

export function ordersListQuery(options?: ListOrdersQueryOptions) {
  return queryOptions({
    queryKey: ordersKeys.list(options),
    queryFn: () => listOrders(options),
    staleTime: ORDER_STALE_MS
  });
}

export function orderQuery(orderId: string) {
  return queryOptions({
    queryKey: ordersKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: orderId.length > 0,
    staleTime: ORDER_STALE_MS
  });
}

export function orderEventsQuery(orderId: string) {
  return queryOptions({
    queryKey: ordersKeys.events(orderId),
    queryFn: () => getOrderEvents(orderId),
    enabled: orderId.length > 0,
    staleTime: ORDER_STALE_MS
  });
}
