import type { OrderStatus } from "@prisma/client";

export const ORDER_CREATED = "order.created" as const;
export const ORDER_STATUS_CHANGED = "order.status_changed" as const;

export interface OrderCreatedEvent {
  readonly orderId: string;
  readonly customerId: string;
  readonly restaurantId: string;
  readonly restaurantOwnerId: string;
  readonly status: OrderStatus;
}

export interface OrderStatusChangedEvent {
  readonly orderId: string;
  readonly customerId: string;
  readonly restaurantId: string;
  readonly restaurantOwnerId: string;
  readonly fromStatus: OrderStatus;
  readonly toStatus: OrderStatus;
  readonly actorId: string;
}
