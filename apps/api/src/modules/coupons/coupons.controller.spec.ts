import type { Coupon } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { CouponNotFoundError } from "../../common/errors/coupon.errors";
import { CouponsController } from "./coupons.controller";
import type { CouponsService } from "./coupons.service";

function buildController(overrides: Partial<CouponsService>): CouponsController {
  return new CouponsController(overrides as CouponsService);
}

const coupon: Coupon = {
  id: "coupon-1",
  restaurantId: "restaurant-1",
  code: "SAVE10",
  percentOff: 10,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z")
};

describe("CouponsController.preview", () => {
  it("returns only the public projection (code + percentOff)", async () => {
    const resolveForOrder = vi.fn().mockResolvedValue(coupon);
    const controller = buildController({ resolveForOrder });

    await expect(controller.preview("restaurant-1", { code: "save10" })).resolves.toEqual({
      code: "SAVE10",
      percentOff: 10
    });
    expect(resolveForOrder).toHaveBeenCalledWith("restaurant-1", "save10");
  });

  it("propagates the typed error when the coupon cannot be resolved", async () => {
    const resolveForOrder = vi.fn().mockRejectedValue(new CouponNotFoundError("nope"));
    const controller = buildController({ resolveForOrder });

    await expect(controller.preview("restaurant-1", { code: "NOPE99" })).rejects.toBeInstanceOf(
      CouponNotFoundError
    );
  });
});
