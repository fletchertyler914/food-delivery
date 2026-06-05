import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from "class-validator";

export class CreateMealDto {
  @ApiProperty({ minLength: 1, maxLength: 120, example: "Bluefin Tuna Nigiri" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 500,
    example: "Two pieces of sushi-grade bluefin over hand-pressed rice."
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({ minimum: 0, example: 1400, description: "Price in integer cents." })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiPropertyOptional({
    maxLength: 2048,
    example: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true, protocols: ["https"] })
  imageUrl?: string;
}
