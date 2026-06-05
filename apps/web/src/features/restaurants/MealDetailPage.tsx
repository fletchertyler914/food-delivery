import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router";

import { paths } from "../../app/paths";
import { CoverImage } from "../../components/CoverImage";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PriceTag } from "../../components/PriceTag";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { AddShoppingCartIcon, ArrowBackIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { RestaurantSwitchDialog } from "../cart/RestaurantSwitchDialog";
import { useAddToCart } from "../cart/use-add-to-cart";
import { mealQuery } from "./queries";

export function MealDetailPage(): ReactElement {
  const { mealId = "" } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const meal = useQuery(mealQuery(mealId));
  const {
    pendingItem,
    tryAddItem,
    confirmReplace,
    cancelReplace,
    disabled: addDisabled,
    buttonLabel: addLabel
  } = useAddToCart({ mealIsActive: meal.data?.isActive ?? false });

  useDocumentTitle(meal.data?.name ?? "Meal");

  if (meal.isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (meal.isError) {
    return (
      <ErrorPanel
        message={getErrorMessage(meal.error, "Could not load meal.")}
        onRetry={() => {
          void meal.refetch();
        }}
      />
    );
  }

  if (!meal.data) {
    return <ErrorPanel message="Meal not found." />;
  }

  const data = meal.data;

  return (
    <Stack spacing={4} maxWidth={960} mx="auto">
      <Button
        component={Link}
        to={paths.restaurant(data.restaurantId)}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ alignSelf: "flex-start", color: "text.secondary" }}
      >
        Back to menu
      </Button>

      <Stack
        direction={{ xs: "column", md: "row" }}
        gap={{ xs: 3, md: 5 }}
        alignItems={{ md: "flex-start" }}
      >
        <Box sx={{ width: { xs: "100%", md: "55%" } }}>
          <CoverImage
            src={data.imageUrl}
            seed={data.name}
            alt={data.name}
            ratio={4 / 3}
            rounded={3}
          />
        </Box>
        <Stack spacing={2.5} flex={1} sx={{ pt: { md: 1 } }}>
          <Typography variant="overline" color="primary.main">
            Meal
          </Typography>
          <Typography variant="h2" component="h1">
            {data.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {data.description}
          </Typography>
          <PriceTag cents={data.priceCents} size="lg" emphasis />
          <Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddShoppingCartIcon />}
              disabled={addDisabled}
              aria-label={`Add ${data.name} to cart`}
              sx={{ width: { xs: "100%", sm: "auto" } }}
              onClick={() => {
                const result = tryAddItem({
                  mealId: data.id,
                  restaurantId: data.restaurantId,
                  name: data.name,
                  priceCents: data.priceCents
                });
                if (result === "added") {
                  enqueueSnackbar(`${data.name} added to your cart`, { variant: "success" });
                }
              }}
            >
              {addLabel}
            </Button>
          </Box>
        </Stack>
      </Stack>

      <RestaurantSwitchDialog
        open={pendingItem !== null}
        newRestaurantName={data.name}
        onConfirm={() => {
          confirmReplace();
          enqueueSnackbar(`${data.name} added to your cart`, { variant: "success" });
        }}
        onCancel={cancelReplace}
      />
    </Stack>
  );
}
