import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import type { OrderStatus, UserRole } from "../../lib/api/types";
import { useAuthStore } from "../auth/auth.store";
import { OrderDetailPage } from "./OrderDetailPage";

interface OrderFixture {
  readonly id: string;
  readonly status: OrderStatus;
  readonly customerId: string;
  readonly restaurantId: string;
}

function makeOrder(overrides: Partial<OrderFixture> = {}): {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurant: { id: string; name: string; imageUrl: string | null; ownerId: string };
  couponId: null;
  status: OrderStatus;
  tipCents: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  items: readonly {
    id: string;
    mealId: string;
    nameSnapshot: string;
    priceCentsSnapshot: number;
    quantity: number;
  }[];
  placedAt: string;
  updatedAt: string;
} {
  const base = {
    id: "order-1",
    customerId: "customer-1",
    restaurantId: "restaurant-1",
    status: "PLACED" as OrderStatus,
    ...overrides
  };
  return {
    id: base.id,
    customerId: base.customerId,
    restaurantId: base.restaurantId,
    restaurant: {
      id: base.restaurantId,
      name: "Demo Kitchen",
      imageUrl: null,
      ownerId: "owner-1"
    },
    couponId: null,
    status: base.status,
    tipCents: 200,
    subtotalCents: 1500,
    discountCents: 0,
    totalCents: 1700,
    items: [
      {
        id: "item-1",
        mealId: "meal-1",
        nameSnapshot: "Burger",
        priceCentsSnapshot: 1500,
        quantity: 1
      }
    ],
    placedAt: new Date("2026-05-29T12:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-29T12:00:00Z").toISOString()
  };
}

function authenticate(role: UserRole, id: string): void {
  useAuthStore.getState().setSession({
    accessToken: "token",
    user: { id, email: `${role.toLowerCase()}@example.com`, name: role, role }
  });
}

function mockOrder(orderState: ReturnType<typeof makeOrder>): void {
  // Allow tests to assert on PATCH transitions without managing
  // module-level mutable state in each `it` block.
  let current = orderState;
  server.use(
    http.get(`/api/v1/orders/${current.id}`, () => HttpResponse.json(current)),
    http.get(`/api/v1/orders/${current.id}/events`, () =>
      HttpResponse.json([
        {
          id: "event-1",
          orderId: current.id,
          fromStatus: null,
          toStatus: current.status,
          actorId: current.customerId,
          actorRole: "CUSTOMER",
          createdAt: current.placedAt
        }
      ])
    ),
    http.patch(`/api/v1/orders/${current.id}/status`, async ({ request }) => {
      const body = (await request.json()) as { toStatus: OrderStatus };
      current = { ...current, status: body.toStatus };
      return HttpResponse.json(current);
    })
  );
}

interface MatrixCase {
  readonly name: string;
  readonly role: UserRole;
  readonly status: OrderStatus;
  readonly expectVisible: readonly string[];
  readonly expectHidden: readonly string[];
}

const MATRIX: readonly MatrixCase[] = [
  {
    name: "owner sees fulfillment buttons on a placed order",
    role: "OWNER",
    status: "PLACED",
    expectVisible: ["start preparing"],
    expectHidden: ["reorder", "mark as received"]
  },
  {
    name: "owner can only advance a processing order",
    role: "OWNER",
    status: "PROCESSING",
    expectVisible: ["send for delivery"],
    expectHidden: ["start preparing", "mark as received"]
  },
  {
    name: "owner can only deliver an in-route order",
    role: "OWNER",
    status: "IN_ROUTE",
    expectVisible: ["mark as delivered"],
    expectHidden: ["mark as received"]
  },
  {
    name: "customer can cancel a placed order but cannot reorder yet",
    role: "CUSTOMER",
    status: "PLACED",
    expectVisible: ["cancel order"],
    expectHidden: ["start preparing", "reorder"]
  },
  {
    name: "customer can mark a delivered order received but cannot reorder yet",
    role: "CUSTOMER",
    status: "DELIVERED",
    expectVisible: ["mark as received"],
    expectHidden: ["cancel order", "reorder"]
  },
  {
    name: "customer cannot reorder a processing order",
    role: "CUSTOMER",
    status: "PROCESSING",
    expectVisible: [],
    expectHidden: ["start preparing", "mark as received", "cancel order", "reorder"]
  },
  {
    name: "customer cannot reorder a canceled order",
    role: "CUSTOMER",
    status: "CANCELED",
    expectVisible: [],
    expectHidden: ["start preparing", "mark as received", "reorder"]
  },
  {
    name: "customer can reorder a received order",
    role: "CUSTOMER",
    status: "RECEIVED",
    expectVisible: ["reorder"],
    expectHidden: ["cancel order", "mark as received"]
  }
];

describe("OrderDetailPage role/state matrix", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(MATRIX)("$name", async (matrixCase) => {
    const order = makeOrder({ status: matrixCase.status });
    mockOrder(order);
    authenticate(matrixCase.role, matrixCase.role === "OWNER" ? "owner-1" : "customer-1");

    renderWithProviders(<OrderDetailPage />, {
      path: "/orders/:orderId",
      route: `/orders/${order.id}`
    });

    for (const label of matrixCase.expectVisible) {
      // Wait for the button to appear; the page renders status timeline
      // and actions together once the query resolves.
      expect(
        await screen.findByRole("button", { name: new RegExp(label, "i") })
      ).toBeInTheDocument();
    }

    for (const label of matrixCase.expectHidden) {
      expect(
        screen.queryByRole("button", { name: new RegExp(label, "i") })
      ).not.toBeInTheDocument();
    }
  });

  it("updates status when owner advances the order", async () => {
    const order = makeOrder({ status: "PLACED" });
    mockOrder(order);
    authenticate("OWNER", "owner-1");

    const user = userEvent.setup();
    renderWithProviders(<OrderDetailPage />, {
      path: "/orders/:orderId",
      route: `/orders/${order.id}`
    });

    await user.click(await screen.findByRole("button", { name: /start preparing/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Preparing").length).toBeGreaterThan(0);
    });
  });
});
