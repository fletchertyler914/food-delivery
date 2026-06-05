import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";

import { BlockNotFoundError, NoCustomerRelationshipError } from "../../common/errors/block.errors";
import { AuthService, type AuthResult } from "../auth/auth.service";
import { BlocksService } from "./blocks.service";
import { MealsService } from "../meals/meals.service";
import { OrdersService } from "../orders/orders.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import { createIntegrationApp, type IntegrationApp } from "../../../test/integration-app";

describe("Blocks integration", () => {
  let testApp: IntegrationApp | undefined;
  let auth: AuthService;
  let blocks: BlocksService;
  let meals: MealsService;
  let orders: OrdersService;
  let restaurants: RestaurantsService;

  beforeAll(async () => {
    testApp = await createIntegrationApp();
    auth = testApp.app.get(AuthService);
    blocks = testApp.app.get(BlocksService);
    meals = testApp.app.get(MealsService);
    orders = testApp.app.get(OrdersService);
    restaurants = testApp.app.get(RestaurantsService);
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("rejects blocking a customer who has never ordered from the owner", async () => {
    const owner = await signupOwner();
    const stranger = await signupCustomer();

    await expect(blocks.block(owner.user.id, stranger.user.id)).rejects.toBeInstanceOf(
      NoCustomerRelationshipError
    );
  });

  it("allows blocking after the customer places an order", async () => {
    const { owner, customer, restaurantId, mealId } = await createOrderFixture();

    await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId, quantity: 1 }]
    });

    await expect(blocks.block(owner.user.id, customer.user.id)).resolves.toBeUndefined();
  });

  it("throws when unblocking a customer that was never blocked", async () => {
    const { owner, customer, restaurantId, mealId } = await createOrderFixture();

    await orders.place(customer.user, {
      restaurantId,
      items: [{ mealId, quantity: 1 }]
    });

    await expect(blocks.unblock(owner.user.id, customer.user.id)).rejects.toBeInstanceOf(
      BlockNotFoundError
    );
  });

  async function createOrderFixture(): Promise<{
    owner: AuthResult;
    customer: AuthResult;
    restaurantId: string;
    mealId: string;
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
    const meal = await meals.create(restaurant.id, owner.user.id, {
      name: "Burger",
      description: "Test burger",
      priceCents: 1_299
    });

    return {
      owner,
      customer,
      restaurantId: restaurant.id,
      mealId: meal.id
    };
  }

  async function signupOwner(): Promise<AuthResult> {
    const suffix = crypto.randomUUID();
    return auth.signup({
      email: `owner-${suffix}@example.com`,
      name: "Owner",
      password: "CorrectHorse42Battery",
      role: UserRole.OWNER
    });
  }

  async function signupCustomer(): Promise<AuthResult> {
    const suffix = crypto.randomUUID();
    return auth.signup({
      email: `customer-${suffix}@example.com`,
      name: "Customer",
      password: "CorrectHorse42Battery",
      role: UserRole.CUSTOMER
    });
  }
});
