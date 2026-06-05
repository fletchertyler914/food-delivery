import { BadRequestException } from "@nestjs/common";

/** Reject PATCH bodies where every field was omitted or undefined. */
export function assertNonEmptyUpdate(data: Record<string, unknown>): void {
  if (Object.keys(data).length === 0) {
    throw new BadRequestException("At least one field must be provided for update.");
  }
}
