import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

// Generic cursor-pagination contract used by list endpoints.
//
// - `take` defaults to PAGE_DEFAULT_TAKE and is bounded so a single
//   request cannot exhaust the database.
// - `cursor` is the id of the last record from the previous page.
//   It is opaque from the client's perspective; the server applies
//   it via Prisma's `cursor` + `skip: 1` pattern.
export const PAGE_DEFAULT_TAKE = 20;
export const PAGE_MAX_TAKE = 50;

export class PageQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGE_MAX_TAKE,
    default: PAGE_DEFAULT_TAKE,
    description: "Page size (max 50)."
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGE_MAX_TAKE)
  take?: number;

  @ApiPropertyOptional({
    description: "Opaque cursor from a prior PaginatedResponse.nextCursor."
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
