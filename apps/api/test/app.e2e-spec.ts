import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OrderStatus, UserRole } from "@prisma/client";
import request from "supertest";
import type { App } from "supertest/types";
import { io, type Socket } from "socket.io-client";
import { SwaggerModule } from "@nestjs/swagger";

import { createIntegrationApp, type IntegrationApp } from "./integration-app";
import { createOpenApiConfig } from "../src/openapi/openapi-document";

interface AuthBody {
  readonly accessToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: UserRole;
  };
}

interface AuthSession extends AuthBody {
  // Raw `Set-Cookie` values, replayed verbatim on subsequent requests
  // so the refresh cookie path/expiry stays identical to what the API
  // emitted. Tests never read or parse the cookie value itself.
  readonly cookies: readonly string[];
}

interface RestaurantBody {
  readonly id: string;
}

interface MealBody {
  readonly id: string;
}

interface CouponBody {
  readonly id: string;
}

interface OrderBody {
  readonly id: string;
  readonly customerId: string;
  readonly status: OrderStatus;
  readonly subtotalCents: number;
  readonly discountCents: number;
  readonly totalCents: number;
  readonly restaurant: {
    readonly id: string;
    readonly name: string;
    readonly imageUrl: string | null;
    readonly ownerId: string;
  };
  readonly items: readonly { readonly mealId: string; readonly priceCentsSnapshot: number }[];
}

interface DuplicateOrderBody {
  readonly order: OrderBody;
  readonly droppedMealNames: readonly string[];
}

interface BlockCandidateBody {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

const API = "/api/v1";
const REFRESH_COOKIE_NAME = "refresh_token";

describe("API e2e", () => {
  let testApp: IntegrationApp | undefined;

  beforeAll(async () => {
    testApp = await createIntegrationApp();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("exposes unauthenticated health probes", async () => {
    const live = await request(server()).get("/health/live").expect(200);
    expect(live.body).toMatchObject({ status: "ok" });

    const ready = await request(server()).get("/health/ready").expect(200);
    expect(ready.body).toMatchObject({
      status: "ok",
      checks: { database: "up" }
    });
  });

  it("runs the core owner/customer order workflow over HTTP", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);

    const restaurant = (
      await request(server())
        .post(`${API}/restaurants`)
        .set(bearer(owner.accessToken))
        .send({ name: "HTTP Kitchen", description: "E2E restaurant" })
        .expect(201)
    ).body as RestaurantBody;

    const meal = (
      await request(server())
        .post(`${API}/restaurants/${restaurant.id}/meals`)
        .set(bearer(owner.accessToken))
        .send({ name: "E2E Burger", description: "E2E meal", priceCents: 1_500 })
        .expect(201)
    ).body as MealBody;

    const coupon = (
      await request(server())
        .post(`${API}/restaurants/${restaurant.id}/coupons`)
        .set(bearer(owner.accessToken))
        .send({ code: "E2E10", percentOff: 10 })
        .expect(201)
    ).body as CouponBody;
    expect(coupon.id).toBeTruthy();

    // Coupon preview is public (guests can validate a code before
    // signing in) and case-insensitive. No bearer token is sent here.
    const preview = (
      await request(server())
        .get(`${API}/restaurants/${restaurant.id}/coupons/preview`)
        .query({ code: "e2e10" })
        .expect(200)
    ).body as { code: string; percentOff: number };
    expect(preview).toEqual({ code: "E2E10", percentOff: 10 });

    await request(server())
      .get(`${API}/restaurants/${restaurant.id}/coupons/preview`)
      .query({ code: "NOPE99" })
      .expect(404);

    const order = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(customer.accessToken))
        .send({
          restaurantId: restaurant.id,
          couponCode: "e2e10",
          tipCents: 200,
          items: [{ mealId: meal.id, quantity: 2 }]
        })
        .expect(201)
    ).body as OrderBody;

    expect(order.status).toBe(OrderStatus.PLACED);
    expect(order.subtotalCents).toBe(3_000);
    expect(order.discountCents).toBe(300);
    expect(order.totalCents).toBe(2_900);
    expect(order.items[0]?.priceCentsSnapshot).toBe(1_500);

    const updated = (
      await request(server())
        .patch(`${API}/orders/${order.id}/status`)
        .set(bearer(owner.accessToken))
        .send({ toStatus: OrderStatus.PROCESSING })
        .expect(200)
    ).body as OrderBody;

    expect(updated.status).toBe(OrderStatus.PROCESSING);

    const events = await request(server())
      .get(`${API}/orders/${order.id}/events`)
      .set(bearer(customer.accessToken))
      .expect(200);

    expect(events.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toStatus: OrderStatus.PLACED }),
        expect.objectContaining({ toStatus: OrderStatus.PROCESSING })
      ])
    );
  });

  it("rotates refresh cookies and revokes them on logout", async () => {
    const auth = await signup(UserRole.CUSTOMER);

    const refreshResponse = await request(server())
      .post(`${API}/auth/refresh`)
      .set("Cookie", cookieHeader(auth.cookies))
      .expect(200);

    const refreshedBody = refreshResponse.body as AuthBody;
    expect(refreshedBody.accessToken).toBeTruthy();

    const rotatedCookies = extractCookies(refreshResponse.headers["set-cookie"]);
    expect(extractRefreshCookie(rotatedCookies)).not.toEqual(extractRefreshCookie(auth.cookies));

    // The old refresh cookie can no longer be exchanged because the
    // server consumed it atomically.
    await request(server())
      .post(`${API}/auth/refresh`)
      .set("Cookie", cookieHeader(auth.cookies))
      .expect(401);

    await request(server())
      .post(`${API}/auth/logout`)
      .set(bearer(refreshedBody.accessToken))
      .set("Cookie", cookieHeader(rotatedCookies))
      .expect(204);

    await request(server())
      .post(`${API}/auth/refresh`)
      .set("Cookie", cookieHeader(rotatedCookies))
      .expect(401);
  });

  it("returns 401 problem+json when /auth/refresh is called without a cookie", async () => {
    const response = await request(server()).post(`${API}/auth/refresh`).expect(401);
    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({
      status: 401,
      code: "INVALID_REFRESH_TOKEN"
    });
  });

  it("returns 401 problem+json when the refresh cookie is unknown/expired", async () => {
    const response = await request(server())
      .post(`${API}/auth/refresh`)
      .set("Cookie", `${REFRESH_COOKIE_NAME}=this-token-does-not-exist`)
      .expect(401);
    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({
      status: 401,
      code: "INVALID_REFRESH_TOKEN"
    });
  });

  it("rejects invalid access tokens with problem+json", async () => {
    const response = await request(server())
      .get(`${API}/orders`)
      .set(bearer("not-a-real-jwt"))
      .expect(401);

    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({ status: 401 });
  });

  it("returns 400 problem+json for malformed signup payloads", async () => {
    const response = await request(server())
      .post(`${API}/auth/signup`)
      .send({ email: "not-an-email", password: "short", name: "", role: "BAD_ROLE" })
      .expect(400);

    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED"
    });
  });

  it("returns 400 when an order is placed without items", async () => {
    const customer = await signup(UserRole.CUSTOMER);
    const owner = await signup(UserRole.OWNER);
    const restaurant = await createRestaurant(owner, "Validation Kitchen");

    const response = await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({ restaurantId: restaurant.id, items: [] })
      .expect(400);

    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({ status: 400 });
  });

  it("returns 404 problem+json when fetching an unknown order id", async () => {
    const customer = await signup(UserRole.CUSTOMER);
    const response = await request(server())
      .get(`${API}/orders/00000000-0000-4000-8000-000000000000`)
      .set(bearer(customer.accessToken))
      .expect(404);

    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({
      status: 404,
      code: "ORDER_NOT_FOUND"
    });
  });

  it("keeps representative order responses aligned with the OpenAPI contract", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "Contract Kitchen");
    const meal = await createMeal(owner, restaurant.id, "Contract Burger", 1_100);

    const response = await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({
        restaurantId: restaurant.id,
        items: [{ mealId: meal.id, quantity: 1 }]
      })
      .expect(201);

    const order = response.body as OrderBody;
    expect(typeof order.id).toBe("string");
    expect(order.status).toBe(OrderStatus.PLACED);
    expect(order.totalCents).toBe(1_100);
    expect(Array.isArray(order.items)).toBe(true);

    const app = testApp?.app;
    if (!app) {
      throw new Error("E2E app was not initialized.");
    }

    const document = SwaggerModule.createDocument(app, createOpenApiConfig());
    expect(document.paths["/api/v1/orders"]?.post?.responses["201"]).toBeDefined();
    expect(document.components?.schemas?.["OrderResponseDto"]).toBeDefined();
    expect(document.components?.schemas?.["OrderStatusEventResponseDto"]).toBeDefined();
    // Cookie-based auth: the public AuthResponseDto must not leak the
    // refresh token. If a future change reintroduces it the test will
    // fail loudly here rather than silently shipping the secret.
    const authResponseSchema = document.components?.schemas?.["AuthResponseDto"];
    expect(authResponseSchema).toBeDefined();
    if (authResponseSchema && "properties" in authResponseSchema) {
      expect(Object.keys(authResponseSchema.properties ?? {})).not.toContain("refreshToken");
    }
    // Public restaurant DTO must not expose ownerId either; the owner
    // view is served by OwnerRestaurantResponseDto.
    const restaurantSchema = document.components?.schemas?.["RestaurantResponseDto"];
    if (restaurantSchema && "properties" in restaurantSchema) {
      expect(Object.keys(restaurantSchema.properties ?? {})).not.toContain("ownerId");
    }
    expect(document.components?.schemas?.["OwnerRestaurantResponseDto"]).toBeDefined();
    // Owner-scoped listing must be advertised at /restaurants/mine.
    expect(document.paths["/api/v1/restaurants/mine"]?.get).toBeDefined();
  });

  it("keeps the committed openapi.json in sync with the live module graph", async () => {
    const app = testApp?.app;
    if (!app) {
      throw new Error("E2E app was not initialized.");
    }

    // The committed `packages/api-client/openapi.json` is the source of
    // truth for the generated client. If it ever drifts from the
    // live module graph, callers regenerate broken types.
    const generated = SwaggerModule.createDocument(app, createOpenApiConfig());
    const committedPath = resolve(__dirname, "../../../packages/api-client/openapi.json");
    const committed: unknown = JSON.parse(await readFile(committedPath, "utf8"));

    expect(generated).toEqual(committed);
  });

  it("rejects role and ownership violations over HTTP", async () => {
    const owner = await signup(UserRole.OWNER);
    const otherOwner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "RBAC Kitchen");
    const meal = await createMeal(owner, restaurant.id, "RBAC Burger", 1_000);
    const coupon = (
      await request(server())
        .post(`${API}/restaurants/${restaurant.id}/coupons`)
        .set(bearer(owner.accessToken))
        .send({ code: "RBAC10", percentOff: 10 })
        .expect(201)
    ).body as CouponBody;

    const order = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(customer.accessToken))
        .send({
          restaurantId: restaurant.id,
          items: [{ mealId: meal.id, quantity: 1 }]
        })
        .expect(201)
    ).body as OrderBody;

    await request(server())
      .patch(`${API}/orders/${order.id}/status`)
      .set(bearer(customer.accessToken))
      .send({ toStatus: OrderStatus.PROCESSING })
      .expect(409);

    await request(server())
      .patch(`${API}/orders/${order.id}/status`)
      .set(bearer(owner.accessToken))
      .send({ toStatus: OrderStatus.RECEIVED })
      .expect(409);

    await request(server())
      .patch(`${API}/restaurants/${restaurant.id}`)
      .set(bearer(otherOwner.accessToken))
      .send({ name: "Stolen Kitchen" })
      .expect(403);

    await request(server())
      .patch(`${API}/meals/${meal.id}`)
      .set(bearer(otherOwner.accessToken))
      .send({ name: "Stolen Burger" })
      .expect(403);

    await request(server())
      .patch(`${API}/coupons/${coupon.id}`)
      .set(bearer(otherOwner.accessToken))
      .send({ percentOff: 20 })
      .expect(403);
  });

  it("pushes realtime order notifications to authenticated users", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);

    const restaurant = (
      await request(server())
        .post(`${API}/restaurants`)
        .set(bearer(owner.accessToken))
        .send({ name: "Realtime Kitchen", description: "Socket test restaurant" })
        .expect(201)
    ).body as RestaurantBody;

    const meal = (
      await request(server())
        .post(`${API}/restaurants/${restaurant.id}/meals`)
        .set(bearer(owner.accessToken))
        .send({ name: "Realtime Burger", description: "Socket test meal", priceCents: 1_200 })
        .expect(201)
    ).body as MealBody;

    const createdEvent = waitForSocketEvent(customer.accessToken, "order.created");
    const ownerCreatedEvent = waitForSocketEvent(owner.accessToken, "order.created");

    const order = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(customer.accessToken))
        .send({
          restaurantId: restaurant.id,
          items: [{ mealId: meal.id, quantity: 1 }]
        })
        .expect(201)
    ).body as OrderBody;

    // `customerId` is part of the wire contract so the web client
    // can tell whether the recipient is the customer (suppress the
    // owner-side "new order" toast) or the restaurant owner.
    expect(await createdEvent).toMatchObject({
      orderId: order.id,
      customerId: customer.user.id,
      restaurantId: restaurant.id,
      status: OrderStatus.PLACED
    });
    expect(await ownerCreatedEvent).toMatchObject({
      orderId: order.id,
      customerId: customer.user.id,
      restaurantId: restaurant.id,
      status: OrderStatus.PLACED
    });

    const statusChangedEvent = waitForSocketEvent(customer.accessToken, "order.status_changed");

    await request(server())
      .patch(`${API}/orders/${order.id}/status`)
      .set(bearer(owner.accessToken))
      .send({ toStatus: OrderStatus.PROCESSING })
      .expect(200);

    // `actorId` is part of the wire contract so the web client can
    // suppress the realtime echo of an action the recipient initiated.
    expect(await statusChangedEvent).toMatchObject({
      orderId: order.id,
      toStatus: OrderStatus.PROCESSING,
      actorId: owner.user.id
    });
  });

  it("rejects unauthenticated realtime connections", async () => {
    const baseUrl = testApp?.baseUrl;
    if (!baseUrl) {
      throw new Error("E2E app base URL was not initialized.");
    }

    await expect(
      new Promise<void>((resolve, reject) => {
        const socket = io(`${baseUrl}/realtime`, {
          transports: ["websocket"],
          forceNew: true,
          reconnection: false
        });
        socket.on("disconnect", () => {
          socket.close();
          resolve();
        });
        socket.on("connect", () => {
          socket.close();
          reject(new Error("Unauthenticated socket connected."));
        });
      })
    ).resolves.toBeUndefined();
  });

  it("does not broadcast order events to unrelated users", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const unrelated = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "Isolation Kitchen");
    const meal = await createMeal(owner, restaurant.id, "Isolation Burger", 1_200);

    const unrelatedEvent = expectNoSocketEvent(unrelated.accessToken, "order.created", 500);

    await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({
        restaurantId: restaurant.id,
        items: [{ mealId: meal.id, quantity: 1 }]
      })
      .expect(201);

    await expect(unrelatedEvent).resolves.toBeUndefined();
  });

  it("returns problem+json when a blocked customer attempts checkout", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);

    const restaurant = (
      await request(server())
        .post(`${API}/restaurants`)
        .set(bearer(owner.accessToken))
        .send({ name: "Block Kitchen", description: "E2E restaurant" })
        .expect(201)
    ).body as RestaurantBody;

    const meal = (
      await request(server())
        .post(`${API}/restaurants/${restaurant.id}/meals`)
        .set(bearer(owner.accessToken))
        .send({ name: "Blocked Burger", description: "E2E meal", priceCents: 1_000 })
        .expect(201)
    ).body as MealBody;

    await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({
        restaurantId: restaurant.id,
        items: [{ mealId: meal.id, quantity: 1 }]
      })
      .expect(201);

    await request(server())
      .post(`${API}/blocks/${customer.user.id}`)
      .set(bearer(owner.accessToken))
      .expect(204);

    const response = await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({
        restaurantId: restaurant.id,
        items: [{ mealId: meal.id, quantity: 1 }]
      })
      .expect(403);

    expect(response.type).toBe("application/problem+json");
    expect(response.body).toMatchObject({
      code: "CUSTOMER_BLOCKED",
      status: 403
    });
  });

  it("lets a customer duplicate a received order", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "Duplicate Kitchen");
    const meal = await createMeal(owner, restaurant.id, "Duplicate Burger", 1_100);

    const original = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(customer.accessToken))
        .send({
          restaurantId: restaurant.id,
          items: [{ mealId: meal.id, quantity: 1 }]
        })
        .expect(201)
    ).body as OrderBody;

    expect(original.status).toBe(OrderStatus.PLACED);
    expect(original.restaurant.name).toBe("Duplicate Kitchen");

    await advanceOrderToReceived(original.id, owner.accessToken, customer.accessToken);

    const duplicated = (
      await request(server())
        .post(`${API}/orders/${original.id}/duplicate`)
        .set(bearer(customer.accessToken))
        .expect(201)
    ).body as DuplicateOrderBody;

    expect(duplicated.order.id).not.toBe(original.id);
    expect(duplicated.order.status).toBe(OrderStatus.PLACED);
    expect(duplicated.order.items[0]?.mealId).toBe(meal.id);
    expect(duplicated.droppedMealNames).toEqual([]);
  });

  it("lets an owner place and duplicate an order", async () => {
    const owner = await signup(UserRole.OWNER);
    const otherOwner = await signup(UserRole.OWNER);
    const restaurant = await createRestaurant(otherOwner, "Owner Buyer Kitchen");
    const meal = await createMeal(otherOwner, restaurant.id, "Owner Buyer Burger", 900);

    const order = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(owner.accessToken))
        .send({
          restaurantId: restaurant.id,
          items: [{ mealId: meal.id, quantity: 1 }]
        })
        .expect(201)
    ).body as OrderBody;

    expect(order.customerId).toBe(owner.user.id);

    await advanceOrderToReceived(order.id, otherOwner.accessToken, owner.accessToken);

    const duplicated = (
      await request(server())
        .post(`${API}/orders/${order.id}/duplicate`)
        .set(bearer(owner.accessToken))
        .expect(201)
    ).body as { order: OrderBody; droppedMealNames: string[] };

    expect(duplicated.order.customerId).toBe(owner.user.id);
    expect(duplicated.droppedMealNames).toEqual([]);
  });

  it("lists block candidates for customers who ordered and removes them after blocking", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "Candidate Kitchen");
    const meal = await createMeal(owner, restaurant.id, "Candidate Burger", 800);

    await request(server())
      .post(`${API}/orders`)
      .set(bearer(customer.accessToken))
      .send({
        restaurantId: restaurant.id,
        items: [{ mealId: meal.id, quantity: 1 }]
      })
      .expect(201);

    const before = (
      await request(server())
        .get(`${API}/blocks/candidates`)
        .set(bearer(owner.accessToken))
        .expect(200)
    ).body as { readonly data: readonly BlockCandidateBody[] };

    expect(before.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: customer.user.id,
          email: customer.user.email
        })
      ])
    );

    await request(server())
      .post(`${API}/blocks/${customer.user.id}`)
      .set(bearer(owner.accessToken))
      .expect(204);

    const after = (
      await request(server())
        .get(`${API}/blocks/candidates`)
        .set(bearer(owner.accessToken))
        .expect(200)
    ).body as { readonly data: readonly BlockCandidateBody[] };

    expect(after.data.some((candidate) => candidate.id === customer.user.id)).toBe(false);
  });

  it("filters owner order lists by status", async () => {
    const owner = await signup(UserRole.OWNER);
    const customer = await signup(UserRole.CUSTOMER);
    const restaurant = await createRestaurant(owner, "Filter Kitchen");
    const meal = await createMeal(owner, restaurant.id, "Filter Burger", 700);

    const placed = (
      await request(server())
        .post(`${API}/orders`)
        .set(bearer(customer.accessToken))
        .send({
          restaurantId: restaurant.id,
          items: [{ mealId: meal.id, quantity: 1 }]
        })
        .expect(201)
    ).body as OrderBody;

    await request(server())
      .patch(`${API}/orders/${placed.id}/status`)
      .set(bearer(owner.accessToken))
      .send({ toStatus: OrderStatus.PROCESSING })
      .expect(200);

    const placedOnly = (
      await request(server())
        .get(`${API}/orders?status=${OrderStatus.PLACED}`)
        .set(bearer(owner.accessToken))
        .expect(200)
    ).body as { readonly data: readonly OrderBody[] };

    expect(placedOnly.data.some((order) => order.id === placed.id)).toBe(false);

    const processingOnly = (
      await request(server())
        .get(`${API}/orders?status=${OrderStatus.PROCESSING}`)
        .set(bearer(owner.accessToken))
        .expect(200)
    ).body as { readonly data: readonly OrderBody[] };

    expect(processingOnly.data.some((order) => order.id === placed.id)).toBe(true);
  });

  async function signup(role: UserRole): Promise<AuthSession> {
    const suffix = crypto.randomUUID();
    const response = await request(server())
      .post(`${API}/auth/signup`)
      .send({
        email: `${role.toLowerCase()}-${suffix}@example.com`,
        name: `${role} User`,
        password: "CorrectHorse42Battery",
        role
      })
      .expect(201);

    const body = response.body as AuthBody;
    return { ...body, cookies: extractCookies(response.headers["set-cookie"]) };
  }

  async function createRestaurant(owner: AuthSession, name: string): Promise<RestaurantBody> {
    const response = await request(server())
      .post(`${API}/restaurants`)
      .set(bearer(owner.accessToken))
      .send({ name, description: `${name} description` })
      .expect(201);

    return response.body as RestaurantBody;
  }

  async function createMeal(
    owner: AuthSession,
    restaurantId: string,
    name: string,
    priceCents: number
  ): Promise<MealBody> {
    const response = await request(server())
      .post(`${API}/restaurants/${restaurantId}/meals`)
      .set(bearer(owner.accessToken))
      .send({ name, description: `${name} description`, priceCents })
      .expect(201);

    return response.body as MealBody;
  }

  function bearer(token: string): { readonly Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  function server(): App {
    const app = testApp?.app;
    if (!app) {
      throw new Error("E2E app was not initialized.");
    }
    const httpServer: unknown = app.getHttpServer();
    return httpServer as App;
  }

  function waitForSocketEvent(token: string, eventName: string): Promise<unknown> {
    const baseUrl = testApp?.baseUrl;
    if (!baseUrl) {
      return Promise.reject(new Error("E2E app base URL was not initialized."));
    }

    return new Promise((resolve, reject) => {
      const socket: Socket = io(`${baseUrl}/realtime`, {
        auth: { token },
        transports: ["websocket"],
        forceNew: true
      });

      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error(`Timed out waiting for ${eventName}`));
      }, 10_000);

      socket.on(eventName, (payload: unknown) => {
        clearTimeout(timeout);
        socket.close();
        resolve(payload);
      });

      socket.on("connect_error", (error: Error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });
    });
  }

  async function advanceOrderToReceived(
    orderId: string,
    restaurantOwnerToken: string,
    customerToken: string
  ): Promise<void> {
    for (const status of [
      OrderStatus.PROCESSING,
      OrderStatus.IN_ROUTE,
      OrderStatus.DELIVERED
    ] as const) {
      await request(server())
        .patch(`${API}/orders/${orderId}/status`)
        .set(bearer(restaurantOwnerToken))
        .send({ toStatus: status })
        .expect(200);
    }

    await request(server())
      .patch(`${API}/orders/${orderId}/status`)
      .set(bearer(customerToken))
      .send({ toStatus: OrderStatus.RECEIVED })
      .expect(200);
  }

  function expectNoSocketEvent(token: string, eventName: string, timeoutMs: number): Promise<void> {
    const baseUrl = testApp?.baseUrl;
    if (!baseUrl) {
      return Promise.reject(new Error("E2E app base URL was not initialized."));
    }

    return new Promise((resolve, reject) => {
      const socket: Socket = io(`${baseUrl}/realtime`, {
        auth: { token },
        transports: ["websocket"],
        forceNew: true
      });

      const timeout = setTimeout(() => {
        socket.close();
        resolve();
      }, timeoutMs);

      socket.on(eventName, (payload: unknown) => {
        clearTimeout(timeout);
        socket.close();
        reject(new Error(`Unexpected ${eventName}: ${JSON.stringify(payload)}`));
      });

      socket.on("connect_error", (error: Error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      });
    });
  }
});

function extractCookies(header: string | string[] | undefined): string[] {
  if (!header) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

function cookieHeader(cookies: readonly string[]): string {
  return cookies
    .map((cookie) => cookie.split(";")[0])
    .filter((value): value is string => value !== undefined && value.length > 0)
    .join("; ");
}

function extractRefreshCookie(cookies: readonly string[]): string | undefined {
  return cookies
    .map((cookie) => cookie.split(";")[0])
    .find((value): value is string => value?.startsWith(`${REFRESH_COOKIE_NAME}=`) === true);
}
