import { ApiProperty } from "@nestjs/swagger";
import type { Meal } from "@prisma/client";

export class MealResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  restaurantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ description: "Price in integer cents." })
  priceCents!: number;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  static from(meal: Meal): MealResponseDto {
    return {
      id: meal.id,
      restaurantId: meal.restaurantId,
      name: meal.name,
      description: meal.description,
      priceCents: meal.priceCents,
      imageUrl: meal.imageUrl,
      isActive: meal.isActive,
      createdAt: meal.createdAt,
      updatedAt: meal.updatedAt
    };
  }
}
