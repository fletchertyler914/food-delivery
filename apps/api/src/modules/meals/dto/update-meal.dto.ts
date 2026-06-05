import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from "class-validator";

// Deactivation is intentionally not exposed here. The canonical path
// is `DELETE /meals/:id` which sets `isActive=false` while preserving
// order history. Allowing it as a PATCH field made it possible for a
// client to silently *re*-activate a soft-deleted meal, which we
// don't want without an explicit reactivation route.
export class UpdateMealDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ minimum: 0, description: "Price in integer cents." })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true, protocols: ["https"] })
  imageUrl?: string;
}
