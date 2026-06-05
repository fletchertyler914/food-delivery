import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OrderStatus, UserRole } from "@prisma/client";

import { CustomerBlockedError } from "../../common/errors/block.errors";
import { CouponCodeTakenError, CouponInactiveError } from "../../common/errors/coupon.errors";
import {
  InvalidStatusTransitionError,
  OrderNotCompleteError
} from "../../common/errors/order.errors";
import { AuthService, type AuthResult } from "../auth/auth.service";
import { BlocksService } from "../blocks/blocks.service";
import { CouponsService } from "../coupons/coupons.service";
import { MealsService } from "../meals/meals.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import { OrdersService } from "./orders.service";
import { createIntegrationApp, type IntegrationApp } from "../../../test/integration-app";

describe("Orders integration", () => {
  let testApp: IntegrationApp | undefined;
  let auth: AuthService;
  let blocks: BlocksService;
  let coupons: CouponsService;
  let meals: MealsService;
  let orders: OrdersService;
  let restaurants: RestaurantsService;

  beforeAll(async () => {
    testApp = await createIntegrationApp();
    auth = testApp.app.get(AuthService);
    blocks = testApp.app.get(BlocksService);
    coupons = testApp.app.get(CouponsService);
    meals = testApp.app.get(MealsService);
    orders = testApp.app.get(OrdersService);
    restaurants = testApp.app.get(RestaurantsService);
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("places an order with snapshotted pricing, coupon discount, and a status event", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    const coupon = await coupons.create(restaurantId, owner.user.id, {
      code: "save10",
      percentOff: 10
    });

    const order = await orders.place(customer.user, {
      restaurantId,
      couponCode: " SAVE10 ",
      tipCents: 250,
      items: [{ mealId: burgerId, quantity: 2 }]
    });

    expect(order.status).toBe(OrderStatus.PLACED);
    expect(order.couponId).toBe(coupon.id);
    expect(order.subtotalCents).toBe(2_598);
    expect(order.discountCents).toBe(259);
    expect(order.totalCents).toBe(2_589);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.priceCentsSnapshot).toBe(1_299);

    const events = await getTestApp().prisma.orderStatusEvent.findMany({
      where: { orderId: order.id }
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.toStatus).toBe(OrderStatus.PLACED);
  });

  it("rejects blocked customers before order creation", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });
    await blocks.block(owner.user.id, customer.user.id);

    await expect(
      orders.place(customer.user, {
        restaurantId,
        items: [{ mealId: burgerId, quantity: 1 }]
      })
    ).rejects.toBeInstanceOf(CustomerBlockedError);
  });

  it("rejects inactive coupons with a typed domain error", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    const coupon = await coupons.create(restaurantId, owner.user.id, {
      code: "inactive",
      percentOff: 20
    });
    await coupons.deactivate(coupon.id, owner.user.id);

    await expect(
      orders.place(customer.user, {
        restaurantId,
        couponCode: "INACTIVE",
        items: [{ mealId: burgerId, quantity: 1 }]
      })
    ).rejects.toBeInstanceOf(CouponInactiveError);
  });

  it("rejects duplicate coupon codes per restaurant with a typed domain error", async () => {
    const { owner, restaurantId } = await createMenuFixture();
    await coupons.create(restaurantId, owner.user.id, {
      code: "dupe",
      percentOff: 10
    });

    await expect(
      coupons.create(restaurantId, owner.user.id, {
        code: " DUPE ",
        percentOff: 20
      })
    ).rejects.toBeInstanceOf(CouponCodeTakenError);
  });

  it("enforces role-aware order status transitions and records events", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    const order = await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });

    await expect(
      orders.transition(order.id, customer.user, OrderStatus.PROCESSING)
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);

    const processing = await orders.transition(order.id, owner.user, OrderStatus.PROCESSING);
    expect(processing.status).toBe(OrderStatus.PROCESSING);

    const events = await getTestApp().prisma.orderStatusEvent.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" }
    });
    expect(events.map((event) => event.toStatus)).toEqual([
      OrderStatus.PLACED,
      OrderStatus.PROCESSING
    ]);
  });

  it("rejects concurrent duplicate status transitions atomically", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    const order = await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });

    const [first, second] = await Promise.allSettled([
      orders.transition(order.id, owner.user, OrderStatus.PROCESSING),
      orders.transition(order.id, owner.user, OrderStatus.PROCESSING)
    ]);

    const fulfilled = [first, second].filter((result) => result.status === "fulfilled");
    const rejected = [first, second].filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.status).toBe("rejected");
    if (rejected[0]?.status === "rejected") {
      expect(rejected[0].reason).toBeInstanceOf(InvalidStatusTransitionError);
    }

    const finalOrder = await getTestApp().prisma.order.findUniqueOrThrow({
      where: { id: order.id }
    });
    expect(finalOrder.status).toBe(OrderStatus.PROCESSING);
  });

  it("lets an owner place and duplicate an order from another owner's restaurant", async () => {
    const { owner, customer, restaurantId, burgerId } = await createMenuFixture();
    const order = await orders.place(owner.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });

    expect(order.customerId).toBe(owner.user.id);
    expect(order.status).toBe(OrderStatus.PLACED);

    const listed = await orders.listAccessible(owner.user, {});
    expect(listed.data.some((candidate) => candidate.id === order.id)).toBe(true);

    await getTestApp().prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.RECEIVED }
    });

    const duplicated = await orders.duplicate(owner.user, order.id);
    expect(duplicated.order.customerId).toBe(owner.user.id);
    expect(duplicated.droppedMealNames).toEqual([]);

    // Sanity: the fixture customer can still order from the same kitchen.
    await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });
  });

  it("duplicates an order using current prices and drops inactive meals", async () => {
    const { customer, restaurantId, burgerId, friesId } = await createMenuFixture();
    const original = await orders.place(customer.user, {
      restaurantId,
      tipCents: 100,
      items: [
        { mealId: burgerId, quantity: 1 },
        { mealId: friesId, quantity: 1 }
      ]
    });

    await getTestApp().prisma.meal.update({ where: { id: friesId }, data: { isActive: false } });
    await getTestApp().prisma.meal.update({ where: { id: burgerId }, data: { priceCents: 1_499 } });
    await getTestApp().prisma.order.update({
      where: { id: original.id },
      data: { status: OrderStatus.RECEIVED }
    });

    const duplicated = await orders.duplicate(customer.user, original.id);

    expect(duplicated.droppedMealNames).toEqual(["Fries"]);
    expect(duplicated.order.items).toHaveLength(1);
    expect(duplicated.order.items[0]?.priceCentsSnapshot).toBe(1_499);
    expect(duplicated.order.totalCents).toBe(1_599);
  });

  it("rejects duplicating an order before it is complete", async () => {
    const { customer, restaurantId, burgerId } = await createMenuFixture();
    const original = await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId: burgerId, quantity: 1 }]
    });

    await expect(orders.duplicate(customer.user, original.id)).rejects.toBeInstanceOf(
      OrderNotCompleteError
    );
  });

  async function createMenuFixture(): Promise<{
    owner: AuthResult;
    customer: AuthResult;
    restaurantId: string;
    burgerId: string;
    friesId: string;
  }> {
    const suffix = crypto.randomUUID();
    const owner = await auth.signup({
      email: `owner-${suffix}@example.com`,
      name: "Owner",
      password: "CorrectHorse42Battery",
      role: UserRole.OWNER
    });
    const customer = await auth.signup({
      email: `customer-${suffix}@example.com`,
      name: "Customer",
      password: "CorrectHorse42Battery",
      role: UserRole.CUSTOMER
    });
    const restaurant = await restaurants.create(owner.user.id, {
      name: `Kitchen ${suffix}`,
      description: "Integration-test restaurant"
    });
    const burger = await meals.create(restaurant.id, owner.user.id, {
      name: "Burger",
      description: "Test burger",
      priceCents: 1_299
    });
    const fries = await meals.create(restaurant.id, owner.user.id, {
      name: "Fries",
      description: "Test fries",
      priceCents: 499
    });

    return {
      owner,
      customer,
      restaurantId: restaurant.id,
      burgerId: burger.id,
      friesId: fries.id
    };
  }

  function getTestApp(): IntegrationApp {
    if (!testApp) {
      throw new Error("Integration app was not initialized.");
    }
    return testApp;
  }
});
