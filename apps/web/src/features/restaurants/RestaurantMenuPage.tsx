import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router";

import { paths } from "../../app/paths";
import { CoverImage } from "../../components/CoverImage";
import { EmptyState } from "../../components/EmptyState";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PriceTag } from "../../components/PriceTag";
import { useCartStore } from "../cart/cart.store";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { formatCents } from "../../lib/format/currency";
import { AddShoppingCartIcon, ArrowBackIcon, RestaurantIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { RestaurantSwitchDialog } from "../cart/RestaurantSwitchDialog";
import { useAddToCart } from "../cart/use-add-to-cart";
import { publicMenuQuery, restaurantQuery } from "./queries";

export function RestaurantMenuPage(): ReactElement {
  const { restaurantId = "" } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const {
    pendingItem,
    tryAddItem,
    confirmReplace,
    cancelReplace,
    disabled: addDisabled,
    buttonLabel: addLabel
  } = useAddToCart();
  const cartItems = useCartStore((state) => state.items);
  const cartRestaurantId = useCartStore((state) => state.restaurantId);

  const restaurant = useQuery(restaurantQuery(restaurantId));
  const meals = useQuery(publicMenuQuery(restaurantId));

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const showCartSummary = cartRestaurantId === restaurantId && cartItems.length > 0;

  useDocumentTitle(restaurant.data?.name ?? "Menu");

  if (restaurant.isLoading || meals.isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (restaurant.isError || meals.isError) {
    const error = restaurant.error ?? meals.error;
    return (
      <ErrorPanel
        message={getErrorMessage(error, "Could not load this menu.")}
        onRetry={() => {
          void restaurant.refetch();
          void meals.refetch();
        }}
      />
    );
  }

  if (!restaurant.data) {
    return <ErrorPanel message="Restaurant not found." />;
  }

  const items = meals.data ?? [];
  const restaurantData = restaurant.data;

  return (
    <Stack spacing={5}>
      <Button
        component={Link}
        to={paths.restaurants}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ alignSelf: "flex-start", color: "text.secondary" }}
      >
        Back to restaurants
      </Button>
      <Box
        sx={{
          position: "relative",
          // Bust out of the parent Container's horizontal padding on
          // mobile so the hero spans edge-to-edge. The negative margin
          // matches Container's xs/sm padding (16px = theme spacing 2).
          mx: { xs: -2, sm: -3, md: 0 },
          borderRadius: { xs: 0, md: 3 },
          overflow: "hidden"
        }}
      >
        <CoverImage
          src={restaurantData.imageUrl}
          seed={restaurantData.name}
          alt={restaurantData.name}
          height={{ xs: 260, sm: 320, md: 380 }}
          rounded={false}
          overlay
        />
        <Box
          sx={{
            position: "absolute",
            left: { xs: 20, sm: 28, md: 40 },
            right: { xs: 20, sm: 28, md: 40 },
            bottom: { xs: 20, sm: 28, md: 36 },
            color: "common.white"
          }}
        >
          <Typography variant="overline" sx={{ opacity: 0.85 }}>
            Menu · {items.length} meal{items.length === 1 ? "" : "s"}
          </Typography>
          <Typography
            variant="h2"
            sx={{
              mt: 1,
              mb: 1,
              color: "common.white",
              fontSize: { xs: "1.875rem", sm: "2.125rem", md: "2.5rem" },
              lineHeight: 1.15
            }}
          >
            {restaurantData.name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              color: "rgba(255,255,255,0.92)",
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, md: 3 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {restaurantData.description}
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={4}>
        <Grid
          size={{
            xs: 12,
            md: showCartSummary ? 8 : 12
          }}
        >
          {items.length === 0 ? (
            <EmptyState
              icon={<RestaurantIcon />}
              title="No meals yet"
              description="The owner hasn't published any meals on this menu."
            />
          ) : (
            <Stack spacing={2}>
              {items.map((meal) => (
                <Card
                  key={meal.id}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    "&:hover": { borderColor: "primary.light" }
                  }}
                >
                  {/* Grid layout: image + content sit side-by-side at
                      every breakpoint, but on mobile the Add button
                      drops to a full-width second row instead of
                      crowding the price column. */}
                  <Box
                    sx={{
                      display: "grid",
                      gap: { xs: 1.5, sm: 2.5 },
                      gridTemplateColumns: { xs: "84px 1fr", sm: "110px 1fr auto" },
                      gridTemplateAreas: {
                        xs: `"image content" "action action"`,
                        sm: `"image content action"`
                      },
                      alignItems: { sm: "center" }
                    }}
                  >
                    <Box sx={{ gridArea: "image" }}>
                      <CoverImage
                        src={meal.imageUrl}
                        seed={meal.name}
                        alt={meal.name}
                        ratio={1}
                        rounded={2}
                      />
                    </Box>
                    <Stack gridArea="content" minWidth={0} gap={0.5}>
                      <Typography
                        component={Link}
                        to={paths.meal(meal.id)}
                        variant="subtitle1"
                        fontWeight={700}
                        color="text.primary"
                        sx={{
                          textDecoration: "none",
                          lineHeight: 1.25,
                          "&:hover": { color: "primary.main" }
                        }}
                      >
                        {meal.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                      >
                        {meal.description}
                      </Typography>
                      <Box mt={0.5}>
                        <PriceTag cents={meal.priceCents} size="md" />
                      </Box>
                    </Stack>
                    <Box sx={{ gridArea: "action" }}>
                      <Button
                        variant="contained"
                        startIcon={<AddShoppingCartIcon />}
                        disabled={addDisabled}
                        aria-label={`Add ${meal.name} to cart`}
                        sx={{ width: { xs: "100%", sm: "auto" } }}
                        onClick={() => {
                          const result = tryAddItem({
                            mealId: meal.id,
                            restaurantId: meal.restaurantId,
                            name: meal.name,
                            priceCents: meal.priceCents
                          });
                          if (result === "added") {
                            enqueueSnackbar(`${meal.name} added to your cart`, {
                              variant: "success"
                            });
                          }
                        }}
                      >
                        {addLabel}
                      </Button>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </Grid>

        {showCartSummary ? (
          <Grid
            size={{
              xs: 12,
              md: 4
            }}
          >
            <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
              <Card sx={{ p: 3, "&:hover": { transform: "none" } }}>
                <Stack spacing={2}>
                  <Typography variant="overline" color="primary.main">
                    Your cart
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="body2" color="text.secondary">
                      {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
                    </Typography>
                    <PriceTag cents={cartSubtotal} size="lg" emphasis />
                  </Stack>
                  <Button
                    component={Link}
                    to={paths.cart}
                    variant="contained"
                    size="large"
                    fullWidth
                  >
                    Review & checkout
                  </Button>
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Subtotal shown · tip and fees added at checkout · {formatCents(cartSubtotal)}
                  </Typography>
                </Stack>
              </Card>
            </Box>
          </Grid>
        ) : null}
      </Grid>
      <RestaurantSwitchDialog
        open={pendingItem !== null}
        newRestaurantName={restaurantData.name}
        onConfirm={() => {
          const name = pendingItem?.name ?? "Item";
          confirmReplace();
          enqueueSnackbar(`${name} added to your cart`, { variant: "success" });
        }}
        onCancel={cancelReplace}
      />
    </Stack>
  );
}
