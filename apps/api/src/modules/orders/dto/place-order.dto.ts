import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

// Limits mirror the DB CHECK constraints in
// 20260529150000_check_constraints_and_owner_denorm. Keeping them in
// sync means malformed payloads fail fast with a structured 400
// instead of bubbling up as a constraint violation 500.
export const MAX_ITEM_QUANTITY = 999;
export const MAX_TIP_CENTS = 1_000_000;

export class PlaceOrderItemDto {
  @ApiProperty()
  @IsString()
  mealId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_ITEM_QUANTITY, example: 2 })
  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}

export class PlaceOrderDto {
  @ApiProperty()
  @IsString()
  restaurantId!: string;

  @ApiProperty({ type: PlaceOrderItemDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlaceOrderItemDto)
  items!: PlaceOrderItemDto[];

  @ApiPropertyOptional({
    minimum: 0,
    maximum: MAX_TIP_CENTS,
    default: 0,
    description: "Tip in integer cents."
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_TIP_CENTS)
  tipCents?: number;

  @ApiPropertyOptional({
    description: "Optional coupon code (case-insensitive).",
    minLength: 3,
    maxLength: 32
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @MinLength(3)
  @MaxLength(32)
  couponCode?: string;
}
