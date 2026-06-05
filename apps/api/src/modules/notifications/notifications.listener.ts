import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import {
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
  type OrderCreatedEvent,
  type OrderStatusChangedEvent
} from "../orders/events/order.events";
import { NotificationsGateway } from "./notifications.gateway";

const REALTIME_ORDER_CREATED = "order.created" as const;
const REALTIME_ORDER_STATUS_CHANGED = "order.status_changed" as const;

@Injectable()
export class NotificationsListener {
  constructor(private readonly gateway: NotificationsGateway) {}

  @OnEvent(ORDER_CREATED, { async: true })
  handleOrderCreated(event: OrderCreatedEvent): void {
    // `customerId` is included so the client can tell whether it's
    // receiving this event because it owns the restaurant or because
    // it placed the order. Owners-buying-from-themselves would
    // otherwise see the kitchen-side "new order" toast on top of
    // their own checkout confirmation.
    this.gateway.emitToUsers([event.customerId, event.restaurantOwnerId], REALTIME_ORDER_CREATED, {
      orderId: event.orderId,
      customerId: event.customerId,
      restaurantId: event.restaurantId,
      status: event.status
    });
  }

  @OnEvent(ORDER_STATUS_CHANGED, { async: true })
  handleStatusChanged(event: OrderStatusChangedEvent): void {
    this.gateway.emitToUsers(
      [event.customerId, event.restaurantOwnerId],
      REALTIME_ORDER_STATUS_CHANGED,
      {
        orderId: event.orderId,
        restaurantId: event.restaurantId,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        actorId: event.actorId
      }
    );
  }
}
