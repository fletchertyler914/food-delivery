import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "../api/client";

export function applyApiFormError<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  codeToField: Partial<Record<string, Path<TValues>>>,
  fallback: string
): void {
  if (error instanceof ApiError) {
    const field = codeToField[error.problem.code];
    const message = error.problem.detail ?? error.problem.title;
    if (field) {
      setError(field, { message });
      return;
    }
    setError("root", { message });
    return;
  }

  setError("root", {
    message: error instanceof Error ? error.message : fallback
  });
}
