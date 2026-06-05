import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ChangeEvent, ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { paths } from "../../app/paths";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PriceTag } from "../../components/PriceTag";
import { SummaryRow } from "../../components/SummaryRow";
import { placeOrder } from "../../lib/api/orders.api";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { formatCents } from "../../lib/format/currency";
import { CreditCardIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { secondaryInfoAlertSx } from "../../theme/css-vars";
import { ordersKeys } from "../orders/queries";
import { checkoutPaymentSchema, type CheckoutPaymentFormValues } from "./checkout.schemas";
import { resolveDiscountCents, resolveTipCents, useCheckoutStore } from "./checkout.store";
import { useCartStore } from "./cart.store";

function formatCardNumberInput(value: string): string {
  const digits = value.replaceAll(/\D/g, "").slice(0, 19);
  return digits.replaceAll(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiryInput(value: string): string {
  const digits = value.replaceAll(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function CheckoutPage(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const clearCart = useCartStore((state) => state.clear);
  const tip = useCheckoutStore((state) => state.tip);
  const appliedCoupon = useCheckoutStore((state) => state.appliedCoupon);
  const clearCheckout = useCheckoutStore((state) => state.clear);

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const tipCents = resolveTipCents(tip, subtotalCents);
  const discountCents = resolveDiscountCents(appliedCoupon, subtotalCents);
  const totalCents = subtotalCents - discountCents + tipCents;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useDocumentTitle(itemCount > 0 ? `Checkout (${String(itemCount)})` : "Checkout");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CheckoutPaymentFormValues>({
    resolver: zodResolver(checkoutPaymentSchema),
    // Prefilled with the canonical Stripe test card so reviewers can
    // place a demo order in one click. Real production checkout would
    // never seed real card data here — but no PSP is wired up.
    defaultValues: {
      nameOnCard: "Demo Diner",
      cardNumber: "4242 4242 4242 4242",
      expiry: "12/30",
      cvv: "123"
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (_payment: CheckoutPaymentFormValues) => {
      if (!restaurantId) {
        throw new Error("Cart is empty.");
      }

      return placeOrder({
        restaurantId,
        tipCents,
        items: items.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity
        })),
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {})
      });
    },
    onSuccess: (order) => {
      clearCart();
      clearCheckout();
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all() });
      enqueueSnackbar("Order placed. Hang tight while the kitchen accepts it.", {
        variant: "success"
      });
      void navigate(paths.order(order.id));
    }
  });

  if (items.length === 0) {
    return (
      <Stack spacing={4}>
        <PageHeader eyebrow="Checkout" title="Payment" />
        <EmptyState
          icon={<CreditCardIcon />}
          title="Your cart is empty"
          description="Add meals from a restaurant menu before checking out."
          action={
            <Button component={Link} to={paths.restaurants} variant="contained">
              Browse restaurants
            </Button>
          }
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Checkout"
        title="Payment"
        description="Place a demo order — no real card will be charged."
      />
      <Grid container spacing={4} alignItems="flex-start">
        <Grid
          size={{
            xs: 12,
            md: 7
          }}
        >
          <Card sx={{ p: { xs: 2, sm: 3 }, "&:hover": { transform: "none" } }}>
            <Stack spacing={2.5}>
              <Alert severity="info" sx={secondaryInfoAlertSx}>
                This is a demo — no real payment will be taken. We&apos;ve pre-filled a test card so
                you can place an order in one click.
              </Alert>

              <Stack
                component="form"
                spacing={2}
                onSubmit={(event) => {
                  void handleSubmit((values) => {
                    checkoutMutation.mutate(values);
                  })(event);
                }}
              >
                <TextField
                  label="Name on card"
                  autoComplete="cc-name"
                  {...register("nameOnCard")}
                  error={Boolean(errors.nameOnCard)}
                  helperText={errors.nameOnCard?.message}
                  required
                  fullWidth
                />
                <TextField
                  label="Card number"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  {...register("cardNumber", {
                    onChange: (event: ChangeEvent<HTMLInputElement>) => {
                      setValue("cardNumber", formatCardNumberInput(event.target.value), {
                        shouldValidate: true
                      });
                    }
                  })}
                  error={Boolean(errors.cardNumber)}
                  helperText={errors.cardNumber?.message}
                  required
                  fullWidth
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Expiry"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    {...register("expiry", {
                      onChange: (event: ChangeEvent<HTMLInputElement>) => {
                        setValue("expiry", formatExpiryInput(event.target.value), {
                          shouldValidate: true
                        });
                      }
                    })}
                    error={Boolean(errors.expiry)}
                    helperText={errors.expiry?.message}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Security code"
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    placeholder="123"
                    {...register("cvv")}
                    error={Boolean(errors.cvv)}
                    helperText={errors.cvv?.message}
                    required
                    fullWidth
                  />
                </Stack>

                {checkoutMutation.isError ? (
                  <Alert severity="error">
                    {getErrorMessage(checkoutMutation.error, "Payment failed.")}
                  </Alert>
                ) : null}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={Link}
                    to={paths.cart}
                    variant="outlined"
                    color="inherit"
                    sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    Back to cart
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending
                      ? "Placing order…"
                      : `Pay ${formatCents(totalCents)}`}
                  </Button>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 5
          }}
        >
          <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
            <Card sx={{ p: { xs: 2.5, sm: 3 }, "&:hover": { transform: "none" } }}>
              <Stack spacing={2}>
                <Typography variant="overline" color="primary.main">
                  Order summary
                </Typography>
                <Stack divider={<Divider flexItem />} spacing={1.5}>
                  {items.map((item) => (
                    <Stack
                      key={item.mealId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="baseline"
                      gap={1}
                    >
                      <Typography variant="body2">
                        {item.name} × {String(item.quantity)}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCents(item.priceCents * item.quantity)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Stack spacing={1.25}>
                  <SummaryRow label="Subtotal" value={formatCents(subtotalCents)} />
                  {appliedCoupon && discountCents > 0 ? (
                    <SummaryRow
                      label={`Discount (${appliedCoupon.code})`}
                      value={`−${formatCents(discountCents)}`}
                    />
                  ) : null}
                  <SummaryRow
                    label={tip.kind === "percent" ? `Tip (${String(tip.percent)}%)` : "Tip"}
                    value={formatCents(tipCents)}
                  />
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                    <Typography variant="subtitle1" fontWeight={700}>
                      Total
                    </Typography>
                    <PriceTag cents={totalCents} size="lg" emphasis />
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Stack>
  );
}
