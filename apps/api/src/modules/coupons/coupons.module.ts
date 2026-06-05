import { Module } from "@nestjs/common";

import { RestaurantsModule } from "../restaurants/restaurants.module";
import { CouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";

@Module({
  imports: [RestaurantsModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService]
})
export class CouponsModule {}
