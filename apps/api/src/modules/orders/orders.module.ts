import { Module } from "@nestjs/common";

import { OrderAccessGuard } from "../../common/guards/order-access.guard";
import { BlocksModule } from "../blocks/blocks.module";
import { CouponsModule } from "../coupons/coupons.module";
import { RestaurantsModule } from "../restaurants/restaurants.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [RestaurantsModule, CouponsModule, BlocksModule],
  controllers: [OrdersController],
  providers: [OrderAccessGuard, OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
