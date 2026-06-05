import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { paths } from "../../app/paths";
import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { useAuthStore } from "./auth.store";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("stores the session after a successful login", async () => {
    server.use(
      http.post("/api/v1/auth/login", () =>
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
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "customer@example.com");
    await user.type(screen.getByLabelText(/password/i), "CorrectHorse42Battery");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("access-token");
    });
  });

  it("preserves ?from on the create-account cross-link", () => {
    renderWithProviders(<LoginPage />, {
      route: `${paths.login}?from=${encodeURIComponent("/checkout")}`,
      path: paths.login
    });

    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute(
      "href",
      `${paths.signup}?from=${encodeURIComponent("/checkout")}`
    );
  });

  it("maps invalid credentials to the password field", async () => {
    server.use(
      http.post("/api/v1/auth/login", () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "Invalid credentials.",
            status: 401,
            detail: "Email or password is incorrect.",
            code: "INVALID_CREDENTIALS"
          },
          { status: 401 }
        )
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), "customer@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/email or password is incorrect/i)).toBeInTheDocument();
  });
});
