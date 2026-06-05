-- Add database-level CHECK constraints so business invariants hold
-- even when bypassing the Nest layer (psql, replicas, migrations,
-- future services). DTO validators are the user-facing layer; these
-- are the floor.

-- Meal price is non-negative integer cents
ALTER TABLE "Meal"
  ADD CONSTRAINT "Meal_priceCents_nonneg_check"
  CHECK ("priceCents" >= 0);

-- Coupon percent off is a meaningful, capped discount
ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_percentOff_range_check"
  CHECK ("percentOff" BETWEEN 1 AND 100);

-- Order monetary fields are non-negative cents; tip is capped at
-- $10,000 to bound abusive inputs that could overflow integer math
-- downstream.
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_tipCents_range_check"
  CHECK ("tipCents" BETWEEN 0 AND 1000000);

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_subtotalCents_nonneg_check"
  CHECK ("subtotalCents" >= 0);

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_discountCents_nonneg_check"
  CHECK ("discountCents" >= 0);

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_totalCents_nonneg_check"
  CHECK ("totalCents" >= 0);

-- Order items must have a positive quantity, capped to prevent abuse
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_range_check"
  CHECK ("quantity" BETWEEN 1 AND 999);

-- Denormalize Order.ownerId so owner-scoped lists/rooms can hit a
-- composite index without a join through Restaurant. Backfill from
-- the current restaurant.ownerId, then enforce NOT NULL + index.
ALTER TABLE "Order" ADD COLUMN "ownerId" TEXT;

UPDATE "Order" AS o
SET "ownerId" = r."ownerId"
FROM "Restaurant" AS r
WHERE r."id" = o."restaurantId";

ALTER TABLE "Order" ALTER COLUMN "ownerId" SET NOT NULL;

CREATE INDEX "Order_ownerId_placedAt_idx" ON "Order"("ownerId", "placedAt");
