import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { paths } from "../../app/paths";
import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "./auth.store";
import { SignupPage } from "./SignupPage";

describe("SignupPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("redirects to ?from after signup", async () => {
    server.use(
      http.post("/api/v1/auth/signup", () =>
        HttpResponse.json({
          accessToken: "access-token",
          user: {
            id: "user-1",
            email: "customer@example.com",
            name: "Customer",
            role: "CUSTOMER"
          }
        })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<SignupPage />, {
      route: `${paths.signup}?from=${encodeURIComponent("/checkout")}`,
      path: paths.signup,
      extraRoutes: [{ path: paths.checkout, element: <div>Checkout</div> }]
    });

    await user.type(screen.getByLabelText(/name/i), "Customer");
    await user.type(screen.getByLabelText(/email/i), "customer@example.com");
    await user.type(screen.getByLabelText(/password/i), "CorrectHorse42Battery");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("access-token");
    });
    await waitFor(() => {
      expect(screen.getByText("Checkout")).toBeInTheDocument();
    });
  });

  it("preserves ?from on the sign-in cross-link", () => {
    renderWithProviders(<SignupPage />, {
      route: `${paths.signup}?from=${encodeURIComponent("/cart")}`,
      path: paths.signup
    });

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      `${paths.login}?from=${encodeURIComponent("/cart")}`
    );
  });
});
