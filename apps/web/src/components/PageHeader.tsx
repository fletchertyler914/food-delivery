import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement, ReactNode } from "react";

export interface PageHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}

// Standardized top-of-page header used across the app. Owns the
// vertical rhythm above page content so individual feature pages do
// not reinvent it.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: PageHeaderProps): ReactElement {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "flex-end" }}
      justifyContent="space-between"
      gap={2}
      mb={4}
    >
      <Box>
        {eyebrow ? (
          <Typography variant="overline" color="primary.main" display="block" mb={1}>
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h3" component="h1" gutterBottom>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Box flexShrink={0} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {actions}
        </Box>
      ) : null}
    </Stack>
  );
}
