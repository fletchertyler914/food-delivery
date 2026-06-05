import { ApiProperty } from "@nestjs/swagger";
import type { Restaurant } from "@prisma/client";

// Public restaurant view: deliberately omits `ownerId` because the
// public catalog should not leak which owner account controls which
// restaurant. Owner-scoped endpoints (e.g. GET /restaurants/mine)
// return `OwnerRestaurantResponseDto` instead.
export class RestaurantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  static from(restaurant: Restaurant): RestaurantResponseDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      imageUrl: restaurant.imageUrl,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt
    };
  }
}

// Owner-scoped view, returned by /restaurants/mine and the
// create/update endpoints. Includes `ownerId` so the SPA can correlate
// the record with the signed-in user even when several owner sessions
// share the same browser profile.
export class OwnerRestaurantResponseDto extends RestaurantResponseDto {
  @ApiProperty()
  ownerId!: string;

  static override from(restaurant: Restaurant): OwnerRestaurantResponseDto {
    return {
      id: restaurant.id,
      ownerId: restaurant.ownerId,
      name: restaurant.name,
      description: restaurant.description,
      imageUrl: restaurant.imageUrl,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt
    };
  }
}
