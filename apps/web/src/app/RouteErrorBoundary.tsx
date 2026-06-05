import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { ErrorOutlineIcon } from "../lib/icons";
import { NotFoundPage } from "../features/common/NotFoundPage";
import { ApiError } from "../lib/api/client";
import { paths } from "./paths";
import { alphaToken } from "../theme/css-vars";

export function RouteErrorBoundary(): ReactElement {
  const error = useRouteError();

  // 404s thrown by loaders (e.g. unknown order id) get a real Not
  // Found UI instead of a generic crash banner.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  // Domain errors carry a stable code + problem detail rendered via
  // the global filter. Surface the human-readable detail so the user
  // sees "Coupon not active" instead of "Something went wrong".
  const isDomain = error instanceof ApiError;
  const title = isDomain ? error.problem.title : "Something went wrong";
  const detail = isDomain
    ? (error.problem.detail ?? error.message)
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again.";

  return (
    <Stack
      alignItems="center"
      textAlign="center"
      gap={3}
      py={{ xs: 6, sm: 10 }}
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
          bgcolor: alphaToken(t, "error.main", 0.1),
          color: "error.main"
        })}
      >
        <ErrorOutlineIcon sx={{ fontSize: 40 }} />
      </Box>
      <Stack gap={1} alignItems="center">
        <Typography variant="overline" color="text.secondary">
          {isDomain ? "Something didn't work" : "Unexpected error"}
        </Typography>
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {detail}
        </Typography>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
        <Button component={Link} to={paths.restaurants} variant="contained" size="large">
          Back to restaurants
        </Button>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          variant="outlined"
          size="large"
        >
          Retry
        </Button>
      </Stack>
    </Stack>
  );
}
