import {
  createBrowserRouter,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject
} from "react-router";

import { useAuthStore } from "../features/auth/auth.store";
import { orderEventsQuery, orderQuery, ordersListQuery } from "../features/orders/queries";
import {
  ownerBlocksQuery,
  ownerCouponsQuery,
  ownerRestaurantsQuery
} from "../features/owner/queries";
import {
  mealQuery,
  publicMenuQuery,
  restaurantQuery,
  restaurantsQuery
} from "../features/restaurants/queries";
import type { UserRole } from "../lib/api/types";
import { App } from "./App";
import { bootstrapAuth } from "./auth-bootstrap";
import { paths } from "./paths";
import { queryClient } from "./query-client";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

// Auth and role checks live at the loader layer so unauthenticated
// users are bounced before any protected route's chunk is even
// downloaded — the production pattern for SPA route guards.
export async function requireAuth({ request }: Pick<LoaderFunctionArgs, "request">): Promise<void> {
  // Wait for the one-shot session restore (no-op once it has run).
  // This covers hard refreshes, deep links, and the case where the
  // SPA was opened from an environment where only the httponly
  // refresh cookie survived (e.g. localStorage cleared but the
  // browser still trusts the refresh cookie).
  await bootstrapAuth();
  if (useAuthStore.getState().accessToken) {
    return;
  }

  const url = new URL(request.url);
  const from = `${url.pathname}${url.search}`;
  throw redirect(`${paths.login}?from=${encodeURIComponent(from)}`);
}

export async function requireRole(
  args: Pick<LoaderFunctionArgs, "request">,
  role: UserRole
): Promise<void> {
  await requireAuth(args);
  const user = useAuthStore.getState().user;
  if (user?.role !== role) {
    throw redirect(paths.restaurants);
  }
}

// Counterpart to `requireAuth` for forms that only make sense for
// signed-out users. Returning the user to the path they were trying
// to reach (when /login was deep-linked with ?from=...) keeps the UX
// honest: clicking back to a protected page after a bookmark click
// shouldn't drop the original intent.
export async function assertAnonymous({
  request
}: Pick<LoaderFunctionArgs, "request">): Promise<null> {
  await bootstrapAuth();
  if (!useAuthStore.getState().user) {
    return null;
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  throw redirect(from?.startsWith("/") ? from : paths.restaurants);
}

function requireParam(value: string | undefined, name: string): string {
  if (!value) {
    throw new Response(`${name} is required.`, { status: 404 });
  }
  return value;
}

// Each route gets its own errorElement so a failure in one route's
// loader/component renders the boundary inside the App shell (header
// and nav remain interactive) instead of unmounting the layout. The
// root-level errorElement is the safety net for catastrophic errors
// thrown above the App component itself.
const errorElement = <RouteErrorBoundary />;

export async function homeLoader(): Promise<null> {
  await bootstrapAuth();
  const user = useAuthStore.getState().user;
  if (user?.role === "OWNER") {
    throw redirect(paths.dashboard);
  }
  if (user?.role === "CUSTOMER") {
    throw redirect(paths.restaurants);
  }
  await queryClient.ensureQueryData(restaurantsQuery());
  return null;
}

const routes: RouteObject[] = [
  {
    path: paths.home,
    Component: App,
    errorElement,
    children: [
      {
        index: true,
        loader: homeLoader,
        lazy: async () => ({
          Component: (await import("../features/marketing/LandingPage")).LandingPage
        })
      },

      {
        path: "restaurants",
        errorElement,
        loader: async () => {
          await queryClient.ensureQueryData(restaurantsQuery());
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/restaurants/RestaurantsPage")).RestaurantsPage
        })
      },

      {
        path: "restaurants/:restaurantId",
        errorElement,
        loader: async ({ params }) => {
          const restaurantId = requireParam(params["restaurantId"], "Restaurant id");
          await Promise.all([
            queryClient.ensureQueryData(restaurantQuery(restaurantId)),
            queryClient.ensureQueryData(publicMenuQuery(restaurantId))
          ]);
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/restaurants/RestaurantMenuPage")).RestaurantMenuPage
        })
      },

      {
        path: "meals/:mealId",
        errorElement,
        loader: async ({ params }) => {
          const mealId = requireParam(params["mealId"], "Meal id");
          await queryClient.ensureQueryData(mealQuery(mealId));
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/restaurants/MealDetailPage")).MealDetailPage
        })
      },

      {
        path: "login",
        errorElement,
        loader: async ({ request }) => assertAnonymous({ request }),
        lazy: async () => ({
          Component: (await import("../features/auth/LoginPage")).LoginPage
        })
      },

      {
        path: "signup",
        errorElement,
        loader: async ({ request }) => assertAnonymous({ request }),
        lazy: async () => ({
          Component: (await import("../features/auth/SignupPage")).SignupPage
        })
      },

      {
        path: "cart",
        errorElement,
        lazy: async () => ({
          Component: (await import("../features/cart/CartPage")).CartPage
        })
      },

      {
        path: "checkout",
        errorElement,
        loader: async ({ request }) => {
          await requireAuth({ request });
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/cart/CheckoutPage")).CheckoutPage
        })
      },

      {
        path: "orders",
        errorElement,
        loader: async ({ request }) => {
          await requireAuth({ request });
          await queryClient.ensureQueryData(ordersListQuery());
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/orders/OrdersPage")).OrdersPage
        })
      },

      {
        path: "orders/:orderId",
        errorElement,
        loader: async ({ request, params }) => {
          await requireAuth({ request });
          const orderId = requireParam(params["orderId"], "Order id");
          await Promise.all([
            queryClient.ensureQueryData(orderQuery(orderId)),
            queryClient.ensureQueryData(orderEventsQuery(orderId))
          ]);
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/orders/OrderDetailPage")).OrderDetailPage
        })
      },

      {
        path: "dashboard",
        errorElement,
        loader: async ({ request }) => {
          await requireRole({ request }, "OWNER");
          // /restaurants/mine is scoped server-side by the bearer
          // token, so the loader no longer needs the userId to
          // prefetch the dashboard's first paint.
          await Promise.all([
            queryClient.ensureQueryData(ownerRestaurantsQuery()),
            queryClient.ensureQueryData(ownerBlocksQuery())
          ]);
          return null;
        },
        lazy: async () => ({
          Component: (await import("../features/owner/OwnerDashboardPage")).OwnerDashboardPage
        })
      },

      // Owner-scoped coupon prefetch is opt-in; the dashboard panel
      // calls ensureQueryData itself when expanded. Keeping this
      // helper here so a deep link from email can pre-populate.
      {
        path: "dashboard/restaurants/:restaurantId/coupons",
        errorElement,
        loader: async ({ request, params }) => {
          await requireRole({ request }, "OWNER");
          const restaurantId = requireParam(params["restaurantId"], "Restaurant id");
          await queryClient.ensureQueryData(ownerCouponsQuery(restaurantId));
          throw redirect(paths.dashboard);
        },
        Component: () => null
      },

      {
        path: "*",
        errorElement,
        lazy: async () => ({
          Component: (await import("../features/common/NotFoundPage")).NotFoundPage
        })
      }
    ]
  }
];

export const router = createBrowserRouter(routes);
