import { devices, expect, test } from "@playwright/test";

// Mobile viewport smoke tests for the hamburger drawer and key page
// layouts. Uses a 375×844 viewport (iPhone 13 dimensions) with
// Chromium so the suite runs without a WebKit install.
//
// Relies on seeded demo data (`pnpm db:seed`) for the restaurant menu
// route. Opt out with SKIP_SMOKE_DEMO=1 like the desktop smoke suite.
test.skip(process.env["SKIP_SMOKE_DEMO"] === "1", "Demo seed not available in this environment.");

test.use({
  viewport: { width: 375, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: devices["iPhone 13"].userAgent
});

test("shows hamburger and hides inline nav on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /open navigation menu/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(0);
});

test("opens the drawer, navigates to restaurants, and closes on route change", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /open navigation menu/i }).click();

  const drawerNav = page.getByRole("navigation", { name: /primary/i });
  await expect(drawerNav).toBeVisible();
  await expect(drawerNav.getByRole("link", { name: /restaurants/i })).toBeVisible();

  await drawerNav.getByRole("link", { name: /restaurants/i }).click();
  await expect(page).toHaveURL(/\/restaurants$/);
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^restaurants$/i })).toBeVisible();
});

test("restaurant menu page has no horizontal overflow", async ({ page }) => {
  await page.goto("/restaurants/seed-rest-roost");
  await expect(page.getByRole("heading", { name: /roost & rye/i })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
  expect(hasHorizontalOverflow).toBe(true);
});

test("empty cart state renders for signed-in customers on mobile", async ({ page }, testInfo) => {
  const email = `mobile-smoke-${String(testInfo.workerIndex)}-${String(Date.now())}@example.com`;

  await page.goto("/signup");
  await page.getByLabel(/name/i).fill("Mobile Smoke");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByRole("heading", { name: /restaurants/i })).toBeVisible();

  await page.getByRole("button", { name: /open navigation menu/i }).click();
  await page
    .getByRole("navigation", { name: /primary/i })
    .getByRole("link", { name: /^cart$/i })
    .click();
  await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
  await expect(page.getByText(/your cart is empty/i)).toBeVisible();
});
