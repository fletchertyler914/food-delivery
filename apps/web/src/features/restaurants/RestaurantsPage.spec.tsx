import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/render-with-providers";
import { server } from "../../test/msw-server";
import { RestaurantsPage } from "./RestaurantsPage";

const restaurants = [
  {
    id: "seed-rest-mizu",
    name: "Mizu Sushi House",
    description: "Edomae nigiri and seasonal omakase.",
    imageUrl: null,
    createdAt: new Date("2026-05-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-01T00:00:00Z").toISOString()
  },
  {
    id: "seed-rest-solera",
    name: "Solera & Vine",
    description: "Spanish tapas, jamón, and natural wines.",
    imageUrl: null,
    createdAt: new Date("2026-05-02T00:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-02T00:00:00Z").toISOString()
  }
];

describe("RestaurantsPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("filters restaurants by search query", async () => {
    server.use(http.get("/api/v1/restaurants", () => HttpResponse.json(restaurants)));

    const user = userEvent.setup();
    renderWithProviders(<RestaurantsPage />);

    expect(await screen.findByText("Mizu Sushi House")).toBeInTheDocument();
    expect(screen.getByText("Solera & Vine")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/search by name or cuisine/i), "solera");

    expect(screen.queryByText("Mizu Sushi House")).not.toBeInTheDocument();
    expect(screen.getByText("Solera & Vine")).toBeInTheDocument();
  });

  it("shows a no-results message when search matches nothing", async () => {
    server.use(http.get("/api/v1/restaurants", () => HttpResponse.json(restaurants)));

    const user = userEvent.setup();
    renderWithProviders(<RestaurantsPage />);

    await screen.findByText("Mizu Sushi House");
    await user.type(screen.getByPlaceholderText(/search by name or cuisine/i), "zzzznotfound");

    expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
  });
});
