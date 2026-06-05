import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement } from "react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";

import { UiProviders } from "../app/UiProviders";

interface RenderOptionsWithRoute extends Omit<RenderOptions, "wrapper"> {
  readonly route?: string;
  /**
   * Additional route definitions to mount inside the test router.
   * Useful when the component under test relies on navigation hooks
   * needing a sibling target route to navigate to.
   */
  readonly extraRoutes?: readonly RouteObject[];
  /**
   * When the component depends on `useParams`, supply the parameter
   * pattern (e.g. `/orders/:orderId`) so the memory router can match
   * it. The default just mounts `ui` at `/`.
   */
  readonly path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptionsWithRoute
): ReturnType<typeof render> {
  // A fresh QueryClient per render isolates cache between tests so a
  // previous test's data can never leak into the current one.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const route = options?.route ?? "/";
  const path = options?.path ?? route;

  // The data router (createMemoryRouter) is what production uses, so
  // tests exercise the same hooks (useNavigation, useNavigate,
  // useSearchParams) under the same provider semantics.
  const router = createMemoryRouter([{ path, element: ui }, ...(options?.extraRoutes ?? [])], {
    initialEntries: [route]
  });

  return render(
    <UiProviders>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </UiProviders>,
    options
  );
}
