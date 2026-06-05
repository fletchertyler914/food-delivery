import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateCouponDto {
  @ApiProperty({
    minLength: 3,
    maxLength: 32,
    example: "SUMMER25",
    description: "Uppercase alphanumeric coupon code, unique per restaurant."
  })
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: "code must be uppercase alphanumeric (with optional - or _)."
  })
  code!: string;

  @ApiProperty({ minimum: 1, maximum: 100, example: 25 })
  @IsInt()
  @Min(1)
  @Max(100)
  percentOff!: number;
}
