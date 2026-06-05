import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";

// Stable problem+json envelope mirrored by the global filter.
// Documented inline as a Swagger schema reference so generated
// clients can model the failure shape uniformly across endpoints.
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export const PROBLEM_DETAILS_SCHEMA: SchemaObject = {
  type: "object",
  required: ["type", "title", "status", "code"],
  properties: {
    type: { type: "string", format: "uri" },
    title: { type: "string" },
    status: { type: "integer" },
    code: { type: "string" },
    detail: { type: "string", nullable: true },
    requestId: { type: "string", nullable: true },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          message: { type: "string" }
        }
      }
    }
  }
};

type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

const STATUS_DESCRIPTION: Record<ErrorStatus, string> = {
  400: "Bad Request — validation failed.",
  401: "Unauthorized — bearer token missing, invalid, or expired.",
  403: "Forbidden — caller lacks permission for this resource.",
  404: "Not Found — resource does not exist.",
  409: "Conflict — request violates a domain invariant or state machine.",
  422: "Unprocessable Entity — domain rule rejected the request.",
  429: "Too Many Requests — throttle limit hit.",
  500: "Internal Server Error — unexpected failure."
};

/**
 * Composite Swagger decorator that documents every error status a
 * controller route can return alongside the canonical problem+json
 * schema. Pass the statuses inline so each operation advertises its
 * exact failure surface.
 */
export function ApiErrorResponses(...statuses: ErrorStatus[]): MethodDecorator & ClassDecorator {
  if (statuses.length === 0) {
    return applyDecorators();
  }

  const decorators = statuses.map((status) =>
    ApiResponse({
      status,
      description: STATUS_DESCRIPTION[status],
      schema: PROBLEM_DETAILS_SCHEMA
    })
  );
  return applyDecorators(...decorators);
}
