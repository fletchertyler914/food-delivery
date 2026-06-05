-- Composite indexes aligned to list/filter query shapes.

-- DropIndex
DROP INDEX IF EXISTS "Meal_restaurantId_idx";

-- CreateIndex
CREATE INDEX "Meal_restaurantId_isActive_createdAt_idx" ON "Meal"("restaurantId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "Coupon_restaurantId_createdAt_idx" ON "Coupon"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_status_placedAt_idx" ON "Order"("customerId", "status", "placedAt");

-- CreateIndex
CREATE INDEX "Order_ownerId_status_placedAt_idx" ON "Order"("ownerId", "status", "placedAt");

-- DropForeignKey
ALTER TABLE "Restaurant" DROP CONSTRAINT "Restaurant_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
