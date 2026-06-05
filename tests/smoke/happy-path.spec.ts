import { expect, test } from "@playwright/test";

// End-to-end smoke test that drives the full happy path against the
// seeded demo stack: login → browse restaurants → add a meal → check
// out with a tip and the seeded WELCOME10 coupon → land on the order
// detail page with the expected status timeline.
//
// The test relies on the demo data seeded by `pnpm db:seed`
// (`customer@example.com` / `Password123!`, "Roost & Rye", and the
// `WELCOME10` coupon). Skip when `SKIP_SMOKE_DEMO=1` so CI jobs that
// don't reseed the database can opt out without deleting the spec.
test.skip(process.env["SKIP_SMOKE_DEMO"] === "1", "Demo seed not available in this environment.");

test("loads the marketing landing page for anonymous visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /restaurant-quality meals/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /food delivery/i }).first()).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Browse restaurants", exact: true })
  ).toBeVisible();
});

test("loads the restaurant browsing entrypoint", async ({ page }) => {
  await page.goto("/restaurants");
  await expect(page.getByRole("heading", { name: /^restaurants$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /food delivery/i }).first()).toBeVisible();
});

test("customer can sign in, place a tipped+coupon order, and see it on the order detail page", async ({
  page
}) => {
  // 1. Sign in as the seeded demo customer.
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("customer@example.com");
  await page.getByLabel(/password/i).fill("Password123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  // After login the SPA redirects to /restaurants by default. Wait
  // for the restaurants list heading to make sure the page is
  // mounted before continuing.
  await expect(page.getByRole("heading", { name: /restaurants/i })).toBeVisible();

  // 2. Open the seeded restaurant and add the first meal.
  await page
    .getByRole("link", { name: /roost & rye/i })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: /roost & rye/i })).toBeVisible();

  const addToCartButtons = page.getByRole("button", { name: /add .* to cart/i });
  await addToCartButtons.first().click();
  await expect(page.getByText(/added to your cart/i).first()).toBeVisible();

  // 3. Move to the cart through the SPA so the in-memory access token
  // stays live while the checkout flow proceeds.
  await page.getByRole("link", { name: /^cart$/i }).click();
  await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();

  await page.getByRole("button", { name: /^tip 500 cents$/i }).click();
  await page.getByLabel(/coupon code/i).fill("WELCOME10");

  // 4. Place the order. Success toast + automatic navigation to the
  //    orders list confirms the API roundtrip worked.
  const orderResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/orders") &&
      response.request().method() === "POST" &&
      response.status() === 201
  );

  await page.getByRole("button", { name: /^place order$/i }).click();
  const order = (await (await orderResponsePromise).json()) as { id: string };
  await expect(page.getByText(/order placed\. hang tight/i)).toBeVisible();
  await expect(page).toHaveURL(/\/orders$/);

  // 5. Open the order created by this test run and assert the detail
  //    page shows PLACED state with the discount rendered.
  await page.locator(`a[href="/orders/${order.id}"]`).click();
  await expect(page).toHaveURL(new RegExp(`/orders/${order.id}$`));
  await expect(page.getByText(/^Placed$/).first()).toBeVisible();
  const body = await page.getByRole("main").textContent();
  expect(body).not.toMatch(/\b(PLACED|PROCESSING|IN_ROUTE|DELIVERED|RECEIVED|CANCELED)\b/);
  await expect(page.getByText(/discount/i)).toBeVisible();
});
