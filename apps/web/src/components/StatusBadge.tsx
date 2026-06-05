import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

import { formatStatusLabel } from "../lib/orders/order-status-machine";
import type { OrderStatus } from "../lib/orders/order-status-machine";

export interface StatusBadgeProps {
  readonly status: OrderStatus;
  readonly size?: "small" | "medium";
}

interface ToneSpec {
  readonly mainKey: "primary" | "secondary" | "info" | "success" | "warning" | "error";
}

const STATUS_TONE: Record<OrderStatus, ToneSpec> = {
  PLACED: { mainKey: "info" },
  PROCESSING: { mainKey: "warning" },
  IN_ROUTE: { mainKey: "secondary" },
  DELIVERED: { mainKey: "success" },
  RECEIVED: { mainKey: "success" },
  CANCELED: { mainKey: "error" }
};

// Pill-shaped badge with a left dot and tinted background. Replaces
// the default MUI Chip color="info" look with a more deliberate,
// production-grade indicator.
export function StatusBadge({ status, size = "small" }: StatusBadgeProps): ReactElement {
  const theme = useTheme();
  const tone = STATUS_TONE[status];
  const palette = theme.palette[tone.mainKey];
  const main = palette.main;
  const dark = palette.dark;
  const dim = size === "small";

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={dim ? 0.75 : 1}
      sx={{
        display: "inline-flex",
        height: dim ? 24 : 30,
        px: dim ? 1.25 : 1.5,
        borderRadius: 999,
        bgcolor: alpha(main, 0.1),
        border: 1,
        borderColor: alpha(main, 0.2),
        color: dark
      }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: dim ? 6 : 7,
          height: dim ? 6 : 7,
          borderRadius: "50%",
          bgcolor: main
        }}
      />
      <Typography
        variant="caption"
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: dim ? "0.6875rem" : "0.75rem",
          lineHeight: 1
        }}
      >
        {formatStatusLabel(status)}
      </Typography>
    </Stack>
  );
}
