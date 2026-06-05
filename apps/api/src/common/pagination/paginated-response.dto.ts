import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, type ClassConstructor } from "class-transformer";

// Concrete subclasses register their item shape via the
// `paginatedResponse(Item)` helper below. Swagger reads the
// per-subclass metadata so each list endpoint advertises a precise
// schema (e.g. `PaginatedOrderResponseDto`) instead of a bare
// generic.
export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data!: T[];

  @ApiPropertyOptional({
    description:
      "Pass back as `cursor` on the next request to fetch the following page. Absent means no more results."
  })
  nextCursor?: string;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly nextCursor: string | undefined;
}

/** Slice an over-fetched page (take + 1 rows) into a stable cursor page. */
export function paginateSlice<T extends { id: string }>(
  items: readonly T[],
  take: number
): PaginatedResult<T> {
  const hasMore = items.length > take;
  const data = hasMore ? items.slice(0, take) : items;
  const last = data[data.length - 1];
  return {
    data,
    nextCursor: hasMore && last !== undefined ? last.id : undefined
  };
}

export function mapPaginated<TEntity, TDto>(
  result: PaginatedResult<TEntity>,
  toDto: (entity: TEntity) => TDto
): { data: TDto[]; nextCursor?: string } {
  const body = { data: result.data.map(toDto) };
  if (result.nextCursor !== undefined) {
    return { ...body, nextCursor: result.nextCursor };
  }
  return body;
}

export function toPaginated<TEntity, TDto>(
  items: readonly TEntity[],
  take: number,
  toDto: (entity: TEntity) => TDto,
  cursorOf: (entity: TEntity) => string
): { data: TDto[]; nextCursor?: string } {
  // We over-fetch by 1 to detect whether more pages exist without a
  // second COUNT query. If we received `take + 1`, the last entity is
  // the next page's cursor and is dropped from the response payload.
  const hasMore = items.length > take;
  const slice = hasMore ? items.slice(0, take) : items;
  const data = slice.map(toDto);
  return hasMore && slice.length > 0
    ? { data, nextCursor: cursorOf(slice[slice.length - 1] as TEntity) }
    : { data };
}

/**
 * Build a concrete `PaginatedResponseDto<Item>` subclass with
 * Swagger metadata bound to `Item`. Use this to expose a per-feature
 * paginated response in OpenAPI without losing the generic shape at
 * runtime.
 */
export function paginatedResponse<T>(
  ItemDto: ClassConstructor<T>
): new () => PaginatedResponseDto<T> {
  class Paginated extends PaginatedResponseDto<T> {
    @ApiProperty({ type: ItemDto, isArray: true })
    @Type(() => ItemDto)
    declare data: T[];
  }

  Object.defineProperty(Paginated, "name", { value: `Paginated${ItemDto.name}` });
  return Paginated;
}
