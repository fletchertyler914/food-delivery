import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

export class UpdateRestaurantDto {
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

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true, protocols: ["https"] })
  imageUrl?: string;
}
