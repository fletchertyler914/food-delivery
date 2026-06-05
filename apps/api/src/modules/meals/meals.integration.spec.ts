import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";

import { MealNotFoundError } from "../../common/errors/resource.errors";
import { AuthService } from "../auth/auth.service";
import { MealsService } from "./meals.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import { createIntegrationApp, type IntegrationApp } from "../../../test/integration-app";

describe("Meals integration", () => {
  let testApp: IntegrationApp | undefined;
  let auth: AuthService;
  let meals: MealsService;
  let restaurants: RestaurantsService;

  beforeAll(async () => {
    testApp = await createIntegrationApp();
    auth = testApp.app.get(AuthService);
    meals = testApp.app.get(MealsService);
    restaurants = testApp.app.get(RestaurantsService);
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it("hides inactive meals from the public getActiveById lookup", async () => {
    const suffix = crypto.randomUUID();
    const owner = await auth.signup({
      email: `owner-${suffix}@example.com`,
      name: "Owner",
      password: "CorrectHorse42Battery",
      role: UserRole.OWNER
    });
    const restaurant = await restaurants.create(owner.user.id, {
      name: `Kitchen ${suffix}`,
      description: "Integration-test restaurant"
    });
    const meal = await meals.create(restaurant.id, owner.user.id, {
      name: "Seasonal Bowl",
      description: "Limited-time dish",
      priceCents: 1_499
    });

    await meals.deactivate(meal.id, owner.user.id);

    await expect(meals.getActiveById(meal.id)).rejects.toBeInstanceOf(MealNotFoundError);
    await expect(meals.getById(meal.id)).resolves.toMatchObject({ id: meal.id, isActive: false });

    const reactivated = await meals.reactivate(meal.id, owner.user.id);
    expect(reactivated.isActive).toBe(true);
    await expect(meals.getActiveById(meal.id)).resolves.toMatchObject({
      id: meal.id,
      isActive: true
    });
  });
});
