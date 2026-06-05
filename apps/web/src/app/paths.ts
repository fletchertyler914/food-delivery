// Centralized route table. Pages and link targets reference these
// constants instead of stringifying paths inline so that renaming a
// route is a single-file edit and so that the parameterized helpers
// can be type-checked against the route definitions in `router.tsx`.

export const paths = {
  home: "/",
  restaurants: "/restaurants",
  restaurant: (id: string): string => `/restaurants/${id}`,
  meal: (id: string): string => `/meals/${id}`,
  login: "/login",
  signup: "/signup",
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  order: (id: string): string => `/orders/${id}`,
  dashboard: "/dashboard",
  dashboardCoupons: (restaurantId: string): string =>
    `/dashboard/restaurants/${restaurantId}/coupons`
} as const;

export type Paths = typeof paths;
