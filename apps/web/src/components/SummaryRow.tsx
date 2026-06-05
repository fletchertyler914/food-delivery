import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

export interface SummaryRowProps {
  readonly label: string;
  readonly value: string;
}

export function SummaryRow({ label, value }: SummaryRowProps): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ fontFeatureSettings: '"tnum"' }}>
        {value}
      </Typography>
    </Stack>
  );
}
