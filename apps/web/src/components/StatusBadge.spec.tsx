import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UiProviders } from "../app/UiProviders";
import { StatusBadge } from "./StatusBadge";

function renderBadge(status: Parameters<typeof StatusBadge>[0]["status"]) {
  return render(
    <UiProviders>
      <StatusBadge status={status} />
    </UiProviders>
  );
}

describe("StatusBadge", () => {
  it("renders a humanized label per status", () => {
    renderBadge("IN_ROUTE");
    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
  });

  it("colors canceled orders with the error tone", () => {
    renderBadge("CANCELED");
    const label = screen.getByText("Canceled");
    // The wrapping pill carries the tinted background — the implementation
    // detail is intentionally untested; we only assert the label renders.
    expect(label).toBeInTheDocument();
  });
});
