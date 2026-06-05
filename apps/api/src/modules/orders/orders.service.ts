import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  OrderStatus,
  UserRole,
  type Meal,
  type Order,
  type OrderItem,
  type OrderStatusEvent
} from "@prisma/client";

import { CustomerBlockedError } from "../../common/errors/block.errors";
import {
  InvalidOrderRestaurantError,
  InvalidStatusTransitionError,
  MealInactiveError,
  OrderNotCompleteError,
  OrderNotFoundError
} from "../../common/errors/order.errors";
import { ResourceForbiddenError } from "../../common/errors/resource.errors";
import { PAGE_DEFAULT_TAKE } from "../../common/pagination/page-query.dto";
import type { PaginatedResult } from "../../common/pagination/paginated-response.dto";
import { paginateSlice } from "../../common/pagination/paginated-response.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { BlocksService } from "../blocks/blocks.service";
import { CouponsService } from "../coupons/coupons.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import type { PlaceOrderDto, PlaceOrderItemDto } from "./dto/place-order.dto";
import {
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
  type OrderCreatedEvent,
  type OrderStatusChangedEvent
} from "./events/order.events";
import { canTransition } from "./domain/order-status-machine";
import { cents } from "./domain/money";
import { computePricing } from "./domain/pricing";

export type OrderWithItems = Order & {
  items: OrderItem[];
  restaurant: { id: string; name: string; imageUrl: string | null; ownerId: string };
};

export interface AuthenticatedActor {
  readonly id: string;
  readonly role: UserRole;
}

export interface DuplicateOrderResult {
  readonly order: OrderWithItems;
  readonly droppedMealNames: string[];
}

export interface ListOrdersPage {
  readonly take?: number;
  readonly cursor?: string;
  readonly status?: readonly OrderStatus[];
}

export interface ListOwnerOrdersPage extends ListOrdersPage {
  readonly restaurantId?: string;
}

// Shape produced by `OrderAccessGuard` and attached to the request.
// Reused by service methods that would otherwise re-fetch the order
// by id immediately after the guard already loaded it.
export type OrderAccessRecord = Order & {
  items: OrderItem[];
  restaurant: { id: string; name: string; ownerId: string; imageUrl: string | null };
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurants: RestaurantsService,
    private readonly coupons: CouponsService,
    private readonly blocks: BlocksService,
    private readonly events: EventEmitter2
  ) {}

  async place(actor: AuthenticatedActor, dto: PlaceOrderDto): Promise<OrderWithItems> {
    const restaurant = await this.restaurants.getById(dto.restaurantId);

    const blocked = await this.blocks.isBlockedByAnyRestaurantOwner(actor.id, restaurant.ownerId);
    if (blocked) {
      throw new CustomerBlockedError();
    }

    const meals = await this.loadActiveMeals(dto.items.map((item) => item.mealId));
    this.assertMealsBelongToRestaurant(meals, restaurant.id);

    const resolvedCoupon = dto.couponCode
      ? await this.coupons.resolveForOrder(restaurant.id, dto.couponCode)
      : null;
    const couponId = resolvedCoupon?.id ?? null;
    const percentOff = resolvedCoupon?.percentOff;

    const pricing = computePricing({
      items: dto.items.map((item) => ({
        priceCents: cents(this.mealOrThrow(meals, item.mealId).priceCents),
        quantity: item.quantity
      })),
      tipCents: cents(dto.tipCents ?? 0),
      ...(percentOff !== undefined && { couponPercentOff: percentOff })
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerId: actor.id,
          restaurantId: restaurant.id,
          // Snapshot the owner alongside the restaurant id so the
          // owner-scoped index can be hit without a join on read.
          ownerId: restaurant.ownerId,
          couponId,
          tipCents: dto.tipCents ?? 0,
          subtotalCents: pricing.subtotalCents,
          discountCents: pricing.discountCents,
          totalCents: pricing.totalCents,
          items: {
            create: dto.items.map((item) => {
              const meal = this.mealOrThrow(meals, item.mealId);
              return {
                mealId: meal.id,
                nameSnapshot: meal.name,
                priceCentsSnapshot: meal.priceCents,
                quantity: item.quantity
              };
            })
          }
        },
        include: {
          items: true,
          restaurant: { select: { id: true, name: true, imageUrl: true, ownerId: true } }
        }
      });

      await tx.orderStatusEvent.create({
        data: {
          orderId: created.id,
          fromStatus: null,
          toStatus: OrderStatus.PLACED,
          actorId: actor.id,
          actorRole: actor.role
        }
      });

      return created;
    });

    this.emitCreated({
      orderId: order.id,
      customerId: actor.id,
      restaurantId: restaurant.id,
      restaurantOwnerId: restaurant.ownerId,
      status: order.status
    });

    return order;
  }

  async transition(
    orderId: string,
    actor: AuthenticatedActor,
    toStatus: OrderStatus,
    preloaded?: OrderAccessRecord
  ): Promise<OrderWithItems> {
    const order =
      preloaded?.id === orderId
        ? preloaded
        : await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: true,
              restaurant: { select: { id: true, name: true, ownerId: true, imageUrl: true } }
            }
          });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const perspectives = this.orderPerspectives(order, actor);
    if (perspectives.size === 0) {
      throw new ResourceForbiddenError("You do not have access to this order.");
    }

    const decision = canTransition(order.status, toStatus, perspectives);

    if (!decision.allowed) {
      throw new InvalidStatusTransitionError(decision.reason);
    }

    const fromStatus = order.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const applied = await tx.order.updateMany({
        where: { id: orderId, status: fromStatus },
        data: { status: toStatus }
      });

      if (applied.count === 0) {
        throw new InvalidStatusTransitionError(
          `Order ${orderId} is no longer ${fromStatus}; transition to ${toStatus} was rejected.`
        );
      }

      await tx.orderStatusEvent.create({
        data: {
          orderId,
          fromStatus,
          toStatus,
          actorId: actor.id,
          actorRole: actor.role
        }
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          items: true,
          restaurant: { select: { id: true, name: true, ownerId: true, imageUrl: true } }
        }
      });
    });

    this.emitStatusChanged({
      orderId,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      restaurantOwnerId: order.restaurant.ownerId,
      fromStatus: order.status,
      toStatus,
      actorId: actor.id
    });

    return updated;
  }

  async duplicate(actor: AuthenticatedActor, orderId: string): Promise<DuplicateOrderResult> {
    const original = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!original) {
      throw new OrderNotFoundError(orderId);
    }
    if (original.customerId !== actor.id) {
      throw new ResourceForbiddenError("You can only duplicate your own orders.");
    }
    if (original.status !== OrderStatus.RECEIVED) {
      throw new OrderNotCompleteError();
    }

    const mealIds = original.items.map((item) => item.mealId);
    const currentMeals = await this.prisma.meal.findMany({
      where: { id: { in: mealIds } }
    });

    const droppedMealNames: string[] = [];
    const survivors: PlaceOrderItemDto[] = [];

    for (const item of original.items) {
      const meal = currentMeals.find((candidate) => candidate.id === item.mealId);
      if (!meal || !meal.isActive || meal.restaurantId !== original.restaurantId) {
        droppedMealNames.push(item.nameSnapshot);
        continue;
      }
      survivors.push({ mealId: meal.id, quantity: item.quantity });
    }

    if (survivors.length === 0) {
      throw new MealInactiveError(
        "All meals from the original order are unavailable; cannot duplicate."
      );
    }

    const duplicated = await this.place(actor, {
      restaurantId: original.restaurantId,
      items: survivors,
      tipCents: original.tipCents
    });

    return { order: duplicated, droppedMealNames };
  }

  async listAccessible(
    actor: AuthenticatedActor,
    page: ListOwnerOrdersPage = {}
  ): Promise<PaginatedResult<OrderWithItems>> {
    if (page.restaurantId !== undefined) {
      // Ownership check is still required even with the denorm,
      // because the caller could probe arbitrary restaurant ids.
      await this.restaurants.getOwned(page.restaurantId, actor.id);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [{ customerId: actor.id }, { ownerId: actor.id }],
        ...(page.restaurantId !== undefined && { restaurantId: page.restaurantId }),
        ...(page.status !== undefined &&
          page.status.length > 0 && { status: { in: [...page.status] } })
      },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, imageUrl: true, ownerId: true } }
      },
      orderBy: [{ placedAt: "desc" }, { id: "desc" }],
      ...this.pageArgs(page)
    });
    return this.toPage(orders, page);
  }

  async getAccessible(
    orderId: string,
    actor: AuthenticatedActor,
    preloaded?: OrderAccessRecord
  ): Promise<OrderWithItems> {
    // If `OrderAccessGuard` already loaded the order onto the
    // request (the common case for `/orders/:id` routes), reuse that
    // snapshot to avoid a second DB roundtrip.
    if (preloaded?.id === orderId) {
      if (this.orderPerspectives(preloaded, actor).size === 0) {
        throw new ResourceForbiddenError("You do not have access to this order.");
      }
      return {
        ...preloaded,
        restaurant: {
          id: preloaded.restaurant.id,
          name: preloaded.restaurant.name,
          imageUrl: preloaded.restaurant.imageUrl,
          ownerId: preloaded.restaurant.ownerId
        }
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, ownerId: true, imageUrl: true } }
      }
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (this.orderPerspectives(order, actor).size === 0) {
      throw new ResourceForbiddenError("You do not have access to this order.");
    }

    return {
      ...order,
      restaurant: {
        id: order.restaurant.id,
        name: order.restaurant.name,
        imageUrl: order.restaurant.imageUrl,
        ownerId: order.restaurant.ownerId
      }
    };
  }

  listStatusEvents(orderId: string): Promise<OrderStatusEvent[]> {
    return this.prisma.orderStatusEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" }
    });
  }

  private pageArgs(page: ListOrdersPage): { take: number; skip?: number; cursor?: { id: string } } {
    const take = (page.take ?? PAGE_DEFAULT_TAKE) + 1;
    return page.cursor !== undefined ? { take, skip: 1, cursor: { id: page.cursor } } : { take };
  }

  private toPage(orders: OrderWithItems[], page: ListOrdersPage): PaginatedResult<OrderWithItems> {
    const requested = page.take ?? PAGE_DEFAULT_TAKE;
    return paginateSlice(orders, requested);
  }

  private orderPerspectives(
    order: Order & { restaurant: { ownerId: string } },
    actor: AuthenticatedActor
  ): Set<UserRole> {
    const perspectives = new Set<UserRole>();
    if (order.customerId === actor.id) {
      perspectives.add(UserRole.CUSTOMER);
    }
    if (order.restaurant.ownerId === actor.id) {
      perspectives.add(UserRole.OWNER);
    }
    return perspectives;
  }

  private async loadActiveMeals(mealIds: readonly string[]): Promise<Meal[]> {
    const meals = await this.prisma.meal.findMany({
      where: { id: { in: [...mealIds] } }
    });

    const missing = mealIds.filter((id) => !meals.some((meal) => meal.id === id));
    if (missing.length > 0) {
      throw new MealInactiveError(`Unknown meals: ${missing.join(", ")}.`);
    }

    const inactive = meals.filter((meal) => !meal.isActive);
    if (inactive.length > 0) {
      throw new MealInactiveError(
        `Inactive meals: ${inactive.map((meal) => meal.name).join(", ")}.`
      );
    }

    return meals;
  }

  private assertMealsBelongToRestaurant(meals: readonly Meal[], restaurantId: string): void {
    if (meals.some((meal) => meal.restaurantId !== restaurantId)) {
      throw new InvalidOrderRestaurantError();
    }
  }

  private mealOrThrow(meals: readonly Meal[], mealId: string): Meal {
    const meal = meals.find((candidate) => candidate.id === mealId);
    if (!meal) {
      throw new MealInactiveError(`Meal ${mealId} not available.`);
    }
    return meal;
  }

  private emitCreated(payload: OrderCreatedEvent): void {
    this.events.emit(ORDER_CREATED, payload);
    this.logger.debug({ event: ORDER_CREATED, orderId: payload.orderId });
  }

  private emitStatusChanged(payload: OrderStatusChangedEvent): void {
    this.events.emit(ORDER_STATUS_CHANGED, payload);
    this.logger.debug({
      event: ORDER_STATUS_CHANGED,
      orderId: payload.orderId,
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus
    });
  }
}
