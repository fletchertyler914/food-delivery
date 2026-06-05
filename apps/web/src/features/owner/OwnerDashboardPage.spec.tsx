import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "../auth/auth.store";
import { OwnerDashboardPage } from "./OwnerDashboardPage";

const ownerRestaurant = {
  id: "restaurant-1",
  ownerId: "owner-1",
  name: "Mizu Sushi House",
  description: "Edomae nigiri and seasonal omakase.",
  imageUrl: null,
  createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
};

const ownerMeal = {
  id: "meal-1",
  restaurantId: "restaurant-1",
  name: "Burger",
  description: "Classic burger",
  priceCents: 1_299,
  imageUrl: null,
  isActive: true,
  createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
};

const ownerCoupon = {
  id: "coupon-1",
  restaurantId: "restaurant-1",
  code: "SAVE10",
  percentOff: 10,
  isActive: true,
  createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
};

function authenticateOwner(): void {
  useAuthStore.getState().setSession({
    accessToken: "token",
    user: {
      id: "owner-1",
      email: "owner@example.com",
      name: "Owner",
      role: "OWNER"
    }
  });
}

function defaultOwnerHandlers(options?: {
  readonly includeBlocks?: boolean;
  readonly includeCandidates?: boolean;
}) {
  const includeBlocks = options?.includeBlocks ?? true;
  const includeCandidates = options?.includeCandidates ?? true;

  const handlers = [
    http.get("/api/v1/restaurants/mine", () => HttpResponse.json([ownerRestaurant])),
    http.get(`/api/v1/restaurants/${ownerRestaurant.id}/meals/all`, () =>
      HttpResponse.json([ownerMeal])
    ),
    http.get(`/api/v1/restaurants/${ownerRestaurant.id}/coupons`, () =>
      HttpResponse.json([ownerCoupon])
    )
  ];

  if (includeCandidates) {
    handlers.push(http.get("/api/v1/blocks/candidates", () => HttpResponse.json({ data: [] })));
  }

  if (includeBlocks) {
    handlers.push(http.get("/api/v1/blocks", () => HttpResponse.json({ data: [] })));
  }

  return handlers;
}

describe("OwnerDashboardPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists restaurants owned by the signed-in owner from /restaurants/mine", async () => {
    server.use(...defaultOwnerHandlers());
    authenticateOwner();

    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    expect(await screen.findByText("Mizu Sushi House")).toBeInTheDocument();
    expect(screen.getByText(/edomae nigiri/i)).toBeInTheDocument();
  });

  it("creates a restaurant via POST /restaurants", async () => {
    let createdBody: unknown;
    server.use(
      ...defaultOwnerHandlers(),
      http.post("/api/v1/restaurants", async ({ request }) => {
        createdBody = await request.json();
        return HttpResponse.json(
          {
            ...ownerRestaurant,
            id: "restaurant-2",
            name: "New Kitchen",
            description: "Brand new"
          },
          { status: 201 }
        );
      })
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    // Wait for the dashboard to finish loading before interacting.
    await screen.findByText("Mizu Sushi House");

    // The new-restaurant form lives in a dialog opened by the page-
    // header CTA. Open it before filling fields.
    await user.click(screen.getByRole("button", { name: /^new restaurant$/i }));
    const dialog = await screen.findByRole("dialog", { name: /new restaurant/i });
    const dialogScope = within(dialog);

    await user.type(dialogScope.getByLabelText(/^name$/i), "New Kitchen");
    await user.type(dialogScope.getByLabelText(/^description$/i), "Brand new");
    await user.click(dialogScope.getByRole("button", { name: /create restaurant/i }));

    await waitFor(() => {
      expect(createdBody).toMatchObject({ name: "New Kitchen", description: "Brand new" });
    });
  });

  it("creates a meal under a restaurant via POST /restaurants/:id/meals", async () => {
    let createdMealBody: unknown;
    server.use(
      ...defaultOwnerHandlers(),
      http.post(`/api/v1/restaurants/${ownerRestaurant.id}/meals`, async ({ request }) => {
        createdMealBody = await request.json();
        return HttpResponse.json(
          {
            ...ownerMeal,
            id: "meal-2",
            name: "Fries",
            description: "Crispy fries",
            priceCents: 499
          },
          { status: 201 }
        );
      })
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /manage meals/i }));

    await screen.findByText(/meals for mizu sushi house/i);

    await user.click(screen.getByRole("button", { name: /^add meal$/i }));
    const dialog = await screen.findByRole("dialog", { name: /add meal/i });
    const dialogScope = within(dialog);

    await user.type(dialogScope.getByLabelText(/^name$/i), "Fries");
    await user.type(dialogScope.getByLabelText(/^description$/i), "Crispy fries");
    await user.type(dialogScope.getByLabelText(/^price$/i), "4.99");
    await user.click(dialogScope.getByRole("button", { name: /add meal/i }));

    await waitFor(() => {
      expect(createdMealBody).toMatchObject({
        name: "Fries",
        description: "Crispy fries",
        priceCents: 499
      });
    });
  });

  it("updates a meal via PATCH /meals/:id", async () => {
    let updatedMealBody: unknown;
    server.use(
      ...defaultOwnerHandlers(),
      http.patch(`/api/v1/meals/${ownerMeal.id}`, async ({ request }) => {
        updatedMealBody = await request.json();
        return HttpResponse.json({
          ...ownerMeal,
          name: "Deluxe Burger",
          priceCents: 1_499
        });
      })
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /manage meals/i }));
    await screen.findByText(/meals for mizu sushi house/i);

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const dialog = await screen.findByRole("dialog", { name: /edit meal/i });
    const dialogScope = within(dialog);

    const nameField = dialogScope.getByLabelText(/^name$/i);
    await user.clear(nameField);
    await user.type(nameField, "Deluxe Burger");
    const priceField = dialogScope.getByLabelText(/^price$/i);
    await user.clear(priceField);
    await user.type(priceField, "14.99");
    await user.click(dialogScope.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updatedMealBody).toMatchObject({
        name: "Deluxe Burger",
        priceCents: 1_499
      });
    });
  });

  it("reactivates an inactive meal via POST /meals/:id/reactivate", async () => {
    let reactivateUrl: string | undefined;
    server.use(
      http.get(`/api/v1/restaurants/${ownerRestaurant.id}/meals/all`, () =>
        HttpResponse.json([{ ...ownerMeal, isActive: false }])
      ),
      http.post(`/api/v1/meals/${ownerMeal.id}/reactivate`, ({ request }) => {
        reactivateUrl = request.url;
        return HttpResponse.json({ ...ownerMeal, isActive: true });
      }),
      ...defaultOwnerHandlers()
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /manage meals/i }));
    await screen.findByText(/meals for mizu sushi house/i);

    await user.click(screen.getByRole("button", { name: /reactivate/i }));

    await waitFor(() => {
      expect(reactivateUrl).toMatch(new RegExp(`/api/v1/meals/${ownerMeal.id}/reactivate$`));
    });
  });

  it("creates a coupon for a restaurant via POST /restaurants/:id/coupons", async () => {
    let createdCouponBody: unknown;
    server.use(
      ...defaultOwnerHandlers(),
      http.post(`/api/v1/restaurants/${ownerRestaurant.id}/coupons`, async ({ request }) => {
        createdCouponBody = await request.json();
        return HttpResponse.json(
          { ...ownerCoupon, id: "coupon-2", code: "WELCOME", percentOff: 25 },
          { status: 201 }
        );
      })
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    await user.click(await screen.findByRole("button", { name: /manage meals/i }));

    const couponCodeField = await screen.findByLabelText(/coupon code/i);
    await user.type(couponCodeField, "WELCOME");
    const percentField = screen.getByLabelText(/percent off/i);
    await user.clear(percentField);
    await user.type(percentField, "25");
    await user.click(screen.getByRole("button", { name: /add coupon/i }));

    await waitFor(() => {
      expect(createdCouponBody).toMatchObject({ code: "WELCOME", percentOff: 25 });
    });
  });

  it("blocks a customer selected from /blocks/candidates", async () => {
    let blockUrl: string | undefined;
    server.use(
      ...defaultOwnerHandlers({ includeCandidates: false }),
      http.get("/api/v1/blocks/candidates", () =>
        HttpResponse.json({
          data: [
            {
              id: "customer-9",
              email: "customer9@example.com",
              name: "Repeat Customer"
            }
          ]
        })
      ),
      http.post("/api/v1/blocks/:customerId", ({ request }) => {
        blockUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      })
    );
    authenticateOwner();

    const user = userEvent.setup();
    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    const customerField = await screen.findByRole("combobox", { name: /customer to block/i });
    fireEvent.mouseDown(customerField);
    await user.click(await screen.findByRole("option", { name: /repeat customer/i }));
    await user.click(screen.getByRole("button", { name: /block customer/i }));
    await user.click(await screen.findByRole("button", { name: /^block$/i }));

    await waitFor(() => {
      expect(blockUrl).toMatch(/\/api\/v1\/blocks\/customer-9$/);
    });
  });

  it("renders blocked customer name and email", async () => {
    server.use(
      ...defaultOwnerHandlers({ includeBlocks: false }),
      http.get("/api/v1/blocks", () =>
        HttpResponse.json({
          data: [
            {
              id: "block-1",
              ownerId: "owner-1",
              customerId: "customer-9",
              createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
              customer: {
                id: "customer-9",
                email: "blocked@example.com",
                name: "Blocked Customer"
              }
            }
          ]
        })
      )
    );
    authenticateOwner();

    renderWithProviders(<OwnerDashboardPage />, { route: "/dashboard" });

    expect(await screen.findByRole("heading", { name: /blocked customers/i })).toBeInTheDocument();
    expect(await screen.findByText("Blocked Customer")).toBeInTheDocument();
    expect(screen.getByText("blocked@example.com")).toBeInTheDocument();
  });
});
