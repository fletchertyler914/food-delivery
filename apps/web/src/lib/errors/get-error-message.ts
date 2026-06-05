import { ApiError } from "../api/client";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.problem.detail ?? error.problem.title;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
