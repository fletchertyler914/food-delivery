import { ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

import { PageQueryDto } from "../../../common/pagination/page-query.dto";

function toStatusArray(value: unknown): OrderStatus[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return (Array.isArray(value) ? value : [value]) as OrderStatus[];
}

export class ListOrdersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) => toStatusArray(value))
  @IsEnum(OrderStatus, { each: true })
  status?: OrderStatus[];

  @ApiPropertyOptional({ description: "Owner-only: filter by restaurant id." })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;
}
