import { Module } from "@nestjs/common";

import { RestaurantsModule } from "../restaurants/restaurants.module";
import { MealsController } from "./meals.controller";
import { MealsService } from "./meals.service";

@Module({
  imports: [RestaurantsModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService]
})
export class MealsModule {}
