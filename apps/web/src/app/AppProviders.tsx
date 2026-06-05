import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactElement } from "react";
import { RouterProvider } from "react-router/dom";

import { NotificationsProvider } from "../lib/ws/NotificationsProvider";
import { AuthBootstrap } from "./AuthBootstrap";
import { queryClient } from "./query-client";
import { router } from "./router";
import { UiProviders } from "./UiProviders";

export function AppProviders(): ReactElement {
  return (
    <UiProviders>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <NotificationsProvider>
            <RouterProvider router={router} />
          </NotificationsProvider>
        </AuthBootstrap>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </UiProviders>
  );
}
