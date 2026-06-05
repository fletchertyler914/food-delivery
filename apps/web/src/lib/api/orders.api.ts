import type {
  DuplicateOrderResponse,
  Order,
  OrderStatus,
  OrderStatusEvent,
  PlaceOrderInput
} from "./types";
import { apiRequest } from "./client";

interface ListOrdersOptions {
  readonly restaurantId?: string;
  readonly status?: readonly OrderStatus[];
}

interface PaginatedOrders {
  readonly data: Order[];
  readonly nextCursor?: string;
}

// The API returns either a paginated envelope (`{ data, nextCursor }`)
// or — historically — a flat array. We accept both shapes so the SPA
// is resilient to either contract while OpenAPI is the source of
// truth.
export async function listOrders(options?: ListOrdersOptions): Promise<Order[]> {
  const params = new URLSearchParams();
  if (options?.restaurantId) {
    params.set("restaurantId", options.restaurantId);
  }
  if (options?.status) {
    for (const status of options.status) {
      params.append("status", status);
    }
  }
  const query = params.toString().length > 0 ? `?${params.toString()}` : "";
  const response = await apiRequest<Order[] | PaginatedOrders>(`/api/v1/orders${query}`);
  return Array.isArray(response) ? response : response.data;
}

export function getOrder(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/api/v1/orders/${orderId}`);
}

export function getOrderEvents(orderId: string): Promise<OrderStatusEvent[]> {
  return apiRequest<OrderStatusEvent[]>(`/api/v1/orders/${orderId}/events`);
}

export function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return apiRequest<Order>("/api/v1/orders", {
    method: "POST",
    body: input
  });
}

export function updateOrderStatus(orderId: string, toStatus: OrderStatus): Promise<Order> {
  return apiRequest<Order>(`/api/v1/orders/${orderId}/status`, {
    method: "PATCH",
    body: { toStatus }
  });
}

export function duplicateOrder(orderId: string): Promise<DuplicateOrderResponse> {
  return apiRequest<DuplicateOrderResponse>(`/api/v1/orders/${orderId}/duplicate`, {
    method: "POST"
  });
}
