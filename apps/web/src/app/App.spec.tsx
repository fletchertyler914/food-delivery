import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../features/auth/auth.store";
import type { AuthUser } from "../lib/api/types";
import { renderWithProviders } from "../test/render-with-providers";
import { App } from "./App";

const customer: AuthUser = {
  id: "user-customer",
  email: "customer@example.com",
  name: "Customer Carla",
  role: "CUSTOMER"
};

const owner: AuthUser = {
  id: "user-owner",
  email: "owner@example.com",
  name: "Owner Olivia",
  role: "OWNER"
};

function setSession(user: AuthUser): void {
  useAuthStore.getState().setSession({ accessToken: "test-token", user });
}

function nav(): HTMLElement {
  return screen.getByRole("navigation", { name: /primary/i });
}

function mockViewport(isMobile: boolean): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: isMobile && query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  );
}

describe("App header", () => {
  beforeEach(() => {
    mockViewport(false);
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().clearSession();
    vi.unstubAllGlobals();
  });

  it("shows sign-in/sign-up affordances and hides protected nav when logged out", () => {
    renderWithProviders(<App />);

    const navRegion = nav();
    expect(within(navRegion).getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /get started/i })).toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /^cart$/i })).toBeInTheDocument();
    expect(within(navRegion).queryByRole("link", { name: /^orders$/i })).not.toBeInTheDocument();
    expect(
      within(navRegion).queryByRole("button", { name: /account menu/i })
    ).not.toBeInTheDocument();
  });

  it("hides sign-in/sign-up and shows the customer nav once a customer is signed in", async () => {
    setSession(customer);
    const userEvt = userEvent.setup();
    renderWithProviders(<App />);

    const navRegion = nav();
    expect(within(navRegion).queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(within(navRegion).queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /^cart$/i })).toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /^orders$/i })).toBeInTheDocument();
    expect(within(navRegion).queryByRole("link", { name: /^dashboard$/i })).not.toBeInTheDocument();

    const trigger = within(navRegion).getByRole("button", {
      name: /account menu for customer carla/i
    });
    await userEvt.click(trigger);

    const menu = await screen.findByRole("menu", { name: /account/i });
    expect(within(menu).getByText("Customer Carla")).toBeInTheDocument();
    expect(within(menu).getByText("customer@example.com")).toBeInTheDocument();
    expect(within(menu).queryByText(/owner/i)).not.toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("shows the cart link and labels the user as Owner when signed in as an owner", async () => {
    setSession(owner);
    const userEvt = userEvent.setup();
    renderWithProviders(<App />);

    const navRegion = nav();
    expect(within(navRegion).getByRole("link", { name: /^cart$/i })).toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /^orders$/i })).toBeInTheDocument();
    expect(within(navRegion).getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();

    const trigger = within(navRegion).getByRole("button", {
      name: /account menu for owner olivia/i
    });
    await userEvt.click(trigger);

    const menu = await screen.findByRole("menu", { name: /account/i });
    expect(within(menu).getByText("Owner Olivia")).toBeInTheDocument();
    expect(within(menu).getByText("owner@example.com")).toBeInTheDocument();
    expect(within(menu).getByText("Owner", { selector: ".MuiChip-label" })).toBeInTheDocument();
  });

  it("shows inline nav and hides the hamburger on desktop", () => {
    renderWithProviders(<App />);

    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open navigation menu/i })).not.toBeInTheDocument();
  });
});

describe("App mobile header", () => {
  beforeEach(() => {
    mockViewport(true);
  });

  afterEach(() => {
    cleanup();
    useAuthStore.getState().clearSession();
    vi.unstubAllGlobals();
  });

  it("shows the hamburger and hides inline nav on mobile", () => {
    renderWithProviders(<App />);

    expect(screen.getByRole("button", { name: /open navigation menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /primary/i })).not.toBeInTheDocument();
  });

  it("opens the drawer with expected links for anonymous users", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /open navigation menu/i }));

    const drawerNav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(drawerNav).getByRole("link", { name: /restaurants/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("link", { name: /^cart$/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("opens the drawer with customer links when signed in", async () => {
    setSession(customer);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getByRole("button", { name: /open navigation menu/i }));

    const drawerNav = screen.getByRole("navigation", { name: /primary/i });
    expect(within(drawerNav).getByRole("link", { name: /^cart$/i })).toBeInTheDocument();
    expect(within(drawerNav).getByRole("link", { name: /^orders$/i })).toBeInTheDocument();
    expect(screen.getByText("Customer Carla")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("closes the drawer when a nav link is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, {
      extraRoutes: [{ path: "/restaurants", element: <div>Restaurants page</div> }]
    });

    await user.click(screen.getByRole("button", { name: /open navigation menu/i }));
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();

    await user.click(
      within(screen.getByRole("navigation", { name: /primary/i })).getByRole("link", {
        name: /restaurants/i
      })
    );

    expect(screen.queryByRole("navigation", { name: /primary/i })).not.toBeInTheDocument();
    expect(await screen.findByText("Restaurants page")).toBeInTheDocument();
  });
});
