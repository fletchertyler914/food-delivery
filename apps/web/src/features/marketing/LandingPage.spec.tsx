import { cleanup, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { LandingPage } from "./LandingPage";

const restaurants = [
  {
    id: "seed-rest-mizu",
    name: "Mizu Sushi House",
    description: "Edomae nigiri and seasonal omakase.",
    imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
    createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
  }
];

describe("LandingPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders hero CTAs and featured restaurants", async () => {
    server.use(http.get("/api/v1/restaurants", () => HttpResponse.json(restaurants)));

    renderWithProviders(<LandingPage />);

    expect(screen.getByRole("heading", { name: /restaurant-quality meals/i })).toBeInTheDocument();
    // Browse and Open-your-kitchen CTAs appear in both the hero and the
    // closing "Two paths" section by design; assert each label points
    // somewhere correct and that the destinations are exactly the
    // expected canonical paths.
    const browseLinks = screen.getAllByRole("link", { name: /browse restaurants/i });
    expect(browseLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of browseLinks) {
      expect(link).toHaveAttribute("href", "/restaurants");
    }
    const openKitchenLinks = screen.getAllByRole("link", { name: /open your kitchen/i });
    expect(openKitchenLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of openKitchenLinks) {
      expect(link).toHaveAttribute("href", "/signup?role=OWNER");
    }
    expect(await screen.findByText("Mizu Sushi House")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /how it works/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /featured kitchens/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /find your next favorite meal/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /run your kitchen/i })).toBeInTheDocument();
  });
});
