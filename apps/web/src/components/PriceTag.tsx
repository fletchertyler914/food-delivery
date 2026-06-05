import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

import { formatCents } from "../lib/format/currency";

export interface PriceTagProps {
  readonly cents: number;
  readonly size?: "sm" | "md" | "lg";
  readonly emphasis?: boolean;
  readonly suffix?: string;
}

// Standardized price display so every monetary value across the app
// reads the same: tabular nums, single source of truth for size, and
// a consistent suffix slot for "/ea" or "subtotal" etc.
export function PriceTag({
  cents,
  size = "md",
  emphasis = false,
  suffix
}: PriceTagProps): ReactElement {
  const variant = size === "lg" ? "h5" : size === "sm" ? "body2" : "subtitle1";

  return (
    <Stack direction="row" alignItems="baseline" gap={0.75}>
      <Typography
        variant={variant}
        component="span"
        sx={{
          fontFeatureSettings: '"tnum"',
          fontWeight: emphasis ? 700 : 600,
          color: emphasis ? "primary.main" : "text.primary"
        }}
      >
        {formatCents(cents)}
      </Typography>
      {suffix ? (
        <Typography variant="caption" component="span" color="text.secondary">
          {suffix}
        </Typography>
      ) : null}
    </Stack>
  );
}
