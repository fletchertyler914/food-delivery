import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

export class UpdateCouponDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  percentOff?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
