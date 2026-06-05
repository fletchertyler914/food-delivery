import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement, ReactNode } from "react";

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
}

// Consistent zero-state used for empty lists, no-results searches, and
// "nothing here yet" surfaces. Avoids the bare-text empty state look
// that came across as unfinished in the previous design.
export function EmptyState({ title, description, action, icon }: EmptyStateProps): ReactElement {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{
        textAlign: "center",
        py: { xs: 6, sm: 9 },
        px: 3,
        borderRadius: 3,
        border: 1,
        borderColor: "divider",
        borderStyle: "dashed",
        bgcolor: "background.paper"
      }}
    >
      {icon ? (
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.100",
            color: "text.secondary"
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Stack gap={0.75} alignItems="center" maxWidth={420}>
        <Typography variant="h6" component="p">
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Stack>
      {action}
    </Stack>
  );
}
