import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { Link } from "react-router";

import { paths } from "../app/paths";

export function AppBrand(): ReactElement {
  return (
    <Stack direction="row" alignItems="center" gap={1.25}>
      <Box
        aria-hidden
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.25,
          background: (t) =>
            `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "primary.contrastText",
          fontWeight: 800,
          fontSize: "0.95rem",
          letterSpacing: "0.02em"
        }}
      >
        FD
      </Box>
      <Typography
        component={Link}
        to={paths.home}
        variant="subtitle1"
        color="inherit"
        sx={{
          textDecoration: "none",
          fontWeight: 800,
          letterSpacing: "-0.01em"
        }}
      >
        Food Delivery
      </Typography>
    </Stack>
  );
}
