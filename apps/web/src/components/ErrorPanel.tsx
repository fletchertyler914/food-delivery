import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import type { ReactElement } from "react";

export interface ErrorPanelProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps): ReactElement {
  return (
    <Alert
      severity="error"
      sx={{ borderRadius: 2, alignItems: "flex-start" }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    >
      <Stack gap={0.5}>{message}</Stack>
    </Alert>
  );
}
