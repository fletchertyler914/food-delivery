import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { Link } from "react-router";

import { CompassIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { paths } from "../../app/paths";
import { alphaToken } from "../../theme/css-vars";

export function NotFoundPage(): ReactElement {
  useDocumentTitle("Page not found");

  return (
    <Stack
      alignItems="center"
      textAlign="center"
      gap={3}
      py={{ xs: 4, sm: 10 }}
      maxWidth={520}
      mx="auto"
    >
      <Box
        sx={(t) => ({
          width: 88,
          height: 88,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alphaToken(t, "primary.main", 0.1),
          color: "primary.main"
        })}
      >
        <CompassIcon sx={{ fontSize: 40 }} />
      </Box>
      <Stack gap={1} alignItems="center">
        <Typography variant="overline" color="text.secondary">
          Error 404
        </Typography>
        <Typography variant="h2" component="h1">
          Off the menu
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you're looking for moved, changed, or was never on the menu in the first place.
        </Typography>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
        <Button component={Link} to={paths.restaurants} variant="contained" size="large">
          Browse restaurants
        </Button>
        <Button component={Link} to={paths.home} variant="outlined" size="large">
          Back home
        </Button>
      </Stack>
    </Stack>
  );
}
