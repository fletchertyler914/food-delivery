import { ApiProperty } from "@nestjs/swagger";
import type { Coupon } from "@prisma/client";

// The customer-facing projection of a coupon. It deliberately omits
// internal fields (id, restaurantId, isActive, timestamps) — a shopper
// only needs the canonical code and the discount it grants to preview
// pricing before placing the order.
export class CouponPreviewResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty({ minimum: 1, maximum: 100 })
  percentOff!: number;

  static from(coupon: Coupon): CouponPreviewResponseDto {
    return {
      code: coupon.code,
      percentOff: coupon.percentOff
    };
  }
}
