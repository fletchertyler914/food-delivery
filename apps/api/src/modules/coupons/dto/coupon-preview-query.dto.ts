import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, MaxLength, MinLength } from "class-validator";

export class CouponPreviewQueryDto {
  @ApiProperty({
    description: "Coupon code to validate (case-insensitive).",
    minLength: 3,
    maxLength: 32
  })
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(3)
  @MaxLength(32)
  code!: string;
}
