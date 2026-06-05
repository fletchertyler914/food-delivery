import { ApiProperty } from "@nestjs/swagger";
import type { Coupon } from "@prisma/client";

export class CouponResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  restaurantId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  percentOff!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  static from(coupon: Coupon): CouponResponseDto {
    return {
      id: coupon.id,
      restaurantId: coupon.restaurantId,
      code: coupon.code,
      percentOff: coupon.percentOff,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt
    };
  }
}
