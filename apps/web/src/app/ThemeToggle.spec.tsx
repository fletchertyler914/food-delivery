import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useUiPreferencesStore } from "../features/ui/ui-preferences.store";
import { UiProviders } from "./UiProviders";
import { ThemeToggle } from "./ThemeToggle";

function renderToggle(): ReturnType<typeof render> {
  return render(
    <UiProviders>
      <ThemeToggle />
    </UiProviders>
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    useUiPreferencesStore.setState({ mode: "system" });
    document.documentElement.removeAttribute("data-light");
    document.documentElement.removeAttribute("data-dark");
  });

  it("cycles system → light → dark → system and updates the document color scheme", async () => {
    const user = userEvent.setup();
    renderToggle();

    expect(useUiPreferencesStore.getState().mode).toBe("system");

    await user.click(screen.getByRole("button", { name: /switch to light mode/i }));
    expect(useUiPreferencesStore.getState().mode).toBe("light");
    await waitFor(() => {
      expect(document.documentElement.hasAttribute("data-light")).toBe(true);
    });

    await user.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(useUiPreferencesStore.getState().mode).toBe("dark");
    await waitFor(() => {
      expect(document.documentElement.hasAttribute("data-dark")).toBe(true);
    });

    await user.click(screen.getByRole("button", { name: /use system theme/i }));
    expect(useUiPreferencesStore.getState().mode).toBe("system");
  });
});
