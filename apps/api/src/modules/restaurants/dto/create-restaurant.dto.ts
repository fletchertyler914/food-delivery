import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

export class CreateRestaurantDto {
  @ApiProperty({ minLength: 1, maxLength: 120, example: "Mizu Sushi House" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 500,
    example: "Edomae nigiri and seasonal omakase, served at our 8-seat counter."
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({
    maxLength: 2048,
    example: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_protocol: true, protocols: ["https"] })
  imageUrl?: string;
}
