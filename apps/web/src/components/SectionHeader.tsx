import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement, ReactNode } from "react";

export interface SectionHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps): ReactElement {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "flex-end" }}
      justifyContent="space-between"
      gap={1.5}
      mb={2.5}
    >
      <Stack gap={0.5}>
        <Typography variant="h5" component="h2">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
      {action ? <Stack sx={{ width: { xs: "100%", sm: "auto" } }}>{action}</Stack> : null}
    </Stack>
  );
}
