import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useState } from "react";
import { Link } from "react-router";

import { paths } from "../../app/paths";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { PriceTag } from "../../components/PriceTag";
import { SummaryRow } from "../../components/SummaryRow";
import { previewCoupon } from "../../lib/api/coupons.api";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { centsToDollars, dollarsToCents, formatCents } from "../../lib/format/currency";
import {
  AddIcon,
  AddShoppingCartIcon,
  CheckCircleIcon,
  DeleteIcon,
  LocalOfferIcon,
  RemoveIcon
} from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { secondaryInfoAlertSx } from "../../theme/css-vars";
import { useAuthStore } from "../auth/auth.store";
import {
  resolveDiscountCents,
  resolveTipCents,
  TIP_PERCENT_PRESETS,
  useCheckoutStore
} from "./checkout.store";
import { MAX_QUANTITY, MIN_QUANTITY, useCartStore } from "./cart.store";

export function CartPage(): ReactElement {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const clear = useCartStore((state) => state.clear);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const tip = useCheckoutStore((state) => state.tip);
  const setTipPercent = useCheckoutStore((state) => state.setTipPercent);
  const setCustomTipCents = useCheckoutStore((state) => state.setCustomTipCents);
  const couponCode = useCheckoutStore((state) => state.couponCode);
  const setCouponCode = useCheckoutStore((state) => state.setCouponCode);
  const appliedCoupon = useCheckoutStore((state) => state.appliedCoupon);
  const applyCoupon = useCheckoutStore((state) => state.applyCoupon);
  const removeCoupon = useCheckoutStore((state) => state.removeCoupon);
  const [customTipInput, setCustomTipInput] = useState<string>(() =>
    tip.kind === "custom" ? centsToDollars(tip.cents) : ""
  );
  const [clearCartOpen, setClearCartOpen] = useState(false);

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const tipCents = resolveTipCents(tip, subtotalCents);
  const discountCents = resolveDiscountCents(appliedCoupon, subtotalCents);
  const totalCents = subtotalCents - discountCents + tipCents;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => {
      if (!restaurantId) {
        throw new Error("Your cart is empty.");
      }
      return previewCoupon(restaurantId, code);
    },
    onSuccess: (coupon) => {
      applyCoupon({ code: coupon.code, percentOff: coupon.percentOff });
      enqueueSnackbar(`Coupon ${coupon.code} applied — ${String(coupon.percentOff)}% off.`, {
        variant: "success"
      });
    }
  });

  const trimmedCode = couponCode.trim();
  const canApply = trimmedCode.length >= 3 && !applyCouponMutation.isPending;

  useDocumentTitle(itemCount > 0 ? `Cart (${String(itemCount)})` : "Cart");

  const toggleValue: number | "custom" = tip.kind === "custom" ? "custom" : tip.percent;

  if (items.length === 0) {
    return (
      <Stack spacing={4}>
        <PageHeader eyebrow="Checkout" title="Your cart" />
        <EmptyState
          icon={<AddShoppingCartIcon />}
          title="Your cart is empty"
          description="Add meals from a single restaurant and they'll appear here."
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
        title="Your cart"
        description={`${String(itemCount)} item${itemCount === 1 ? "" : "s"} in your cart.`}
      />
      <Grid container spacing={4} alignItems="flex-start">
        <Grid
          size={{
            xs: 12,
            md: 7
          }}
        >
          <Card sx={{ p: { xs: 2, sm: 3 }, "&:hover": { transform: "none" } }}>
            <Stack divider={<Divider flexItem />} spacing={2.5}>
              {items.map((item) => (
                <Stack key={item.mealId} direction="row" alignItems="center" gap={2}>
                  <QuantityStepper
                    value={item.quantity}
                    label={item.name}
                    onChange={(next) => {
                      setQuantity(item.mealId, next);
                    }}
                    onRemove={() => {
                      removeItem(item.mealId);
                    }}
                  />
                  <Stack gap={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {item.name}
                    </Typography>
                    {item.quantity > 1 ? (
                      <Typography variant="body2" color="text.secondary">
                        {formatCents(item.priceCents)} each
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCents(item.priceCents * item.quantity)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Typography variant="overline" color="text.secondary">
                Tip
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={toggleValue}
                onChange={(_event, value: number | "custom" | null) => {
                  if (value === null) {
                    return;
                  }
                  if (value === "custom") {
                    setCustomTipCents(tipCents);
                    setCustomTipInput(tipCents > 0 ? centsToDollars(tipCents) : "");
                    return;
                  }
                  setTipPercent(value);
                }}
                aria-label="tip"
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: 1,
                  "& .MuiToggleButton-root": {
                    minWidth: 0,
                    width: "100%",
                    px: 1,
                    whiteSpace: "nowrap",
                    borderRadius: "10px !important",
                    border: "1px solid !important",
                    borderColor: "divider",
                    margin: "0 !important"
                  }
                }}
              >
                {TIP_PERCENT_PRESETS.map((percent) => (
                  <ToggleButton
                    key={percent}
                    value={percent}
                    aria-label={`Tip ${String(percent)} percent`}
                  >
                    {percent}%
                  </ToggleButton>
                ))}
                <ToggleButton value="custom" aria-label="Enter a custom tip">
                  Custom
                </ToggleButton>
              </ToggleButtonGroup>
              {tip.kind === "custom" ? (
                <TextField
                  label="Custom tip"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={customTipInput}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setCustomTipInput(raw);
                    if (raw.trim().length === 0) {
                      setCustomTipCents(0);
                      return;
                    }
                    const cents = dollarsToCents(raw);
                    if (Number.isFinite(cents) && cents >= 0) {
                      setCustomTipCents(cents);
                    }
                  }}
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    },
                    htmlInput: {
                      "aria-label": "Custom tip amount in dollars"
                    }
                  }}
                />
              ) : null}
            </Stack>

            <Stack spacing={1.5} mt={3}>
              <Typography variant="overline" color="text.secondary">
                Coupon
              </Typography>
              {appliedCoupon ? (
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon fontSize="inherit" />}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        removeCoupon();
                        applyCouponMutation.reset();
                      }}
                    >
                      Remove
                    </Button>
                  }
                >
                  <strong>{appliedCoupon.code}</strong> applied — {appliedCoupon.percentOff}% off
                </Alert>
              ) : (
                <>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <TextField
                      placeholder="Add a code"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase());
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && canApply) {
                          event.preventDefault();
                          applyCouponMutation.mutate(trimmedCode);
                        }
                      }}
                      fullWidth
                      error={applyCouponMutation.isError}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocalOfferIcon fontSize="small" color="disabled" />
                            </InputAdornment>
                          )
                        },
                        htmlInput: {
                          "aria-label": "Coupon code",
                          autoCapitalize: "characters",
                          autoCorrect: "off",
                          spellCheck: false,
                          style: { textTransform: "uppercase" }
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={() => {
                        applyCouponMutation.mutate(trimmedCode);
                      }}
                      disabled={!canApply}
                      sx={{ flexShrink: 0, px: 3, height: 56 }}
                    >
                      {applyCouponMutation.isPending ? "Applying…" : "Apply"}
                    </Button>
                  </Stack>
                  {applyCouponMutation.isError ? (
                    <Typography variant="caption" color="error">
                      {getErrorMessage(applyCouponMutation.error, "That coupon can’t be applied.")}
                    </Typography>
                  ) : null}
                </>
              )}
            </Stack>

            <Stack direction="row" spacing={1.5} mt={3} justifyContent="flex-end">
              <Button
                variant="text"
                color="inherit"
                onClick={() => {
                  setClearCartOpen(true);
                }}
              >
                Clear cart
              </Button>
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
              <Stack spacing={2.5}>
                <Typography variant="overline" color="primary.main">
                  Order summary
                </Typography>
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

                {user === null ? (
                  <Alert severity="info" sx={(t) => ({ ...secondaryInfoAlertSx(t), py: 0.5 })}>
                    You&apos;ll sign in to confirm payment.
                  </Alert>
                ) : null}

                <Button
                  component={Link}
                  to={
                    user
                      ? paths.checkout
                      : `${paths.login}?from=${encodeURIComponent(paths.checkout)}`
                  }
                  variant="contained"
                  size="large"
                  fullWidth
                  state={{ restaurantId }}
                >
                  Continue to checkout
                </Button>
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  You can review your order before paying.
                </Typography>
              </Stack>
            </Card>
          </Box>
        </Grid>
      </Grid>
      <ConfirmDialog
        open={clearCartOpen}
        title="Empty your cart?"
        description="All items will be removed. You can always browse the menu again."
        confirmLabel="Clear cart"
        onClose={() => {
          setClearCartOpen(false);
        }}
        onConfirm={() => {
          clear();
          setClearCartOpen(false);
        }}
      />
    </Stack>
  );
}

interface QuantityStepperProps {
  readonly value: number;
  readonly label: string;
  readonly onChange: (next: number) => void;
  readonly onRemove?: () => void;
}

// Pill-shaped quantity stepper, in the style of common food-delivery
// carts. When the quantity is at the minimum, the decrement button
// becomes a remove action (trash icon) so the row needs no separate
// delete button.
function QuantityStepper({ value, label, onChange, onRemove }: QuantityStepperProps): ReactElement {
  const removeMode = value <= MIN_QUANTITY && onRemove !== undefined;

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        flexShrink: 0,
        border: 1,
        borderColor: "divider",
        borderRadius: 999,
        p: 0.25
      }}
    >
      <StepButton
        ariaLabel={removeMode ? `Remove ${label} from cart` : `Decrease quantity for ${label}`}
        disabled={value <= MIN_QUANTITY && !removeMode}
        onClick={() => {
          if (removeMode) {
            onRemove();
            return;
          }
          onChange(value - 1);
        }}
      >
        {removeMode ? <DeleteIcon sx={{ fontSize: 18 }} /> : <RemoveIcon sx={{ fontSize: 18 }} />}
      </StepButton>
      <Typography
        component="span"
        aria-label={`Quantity for ${label}`}
        sx={{
          minWidth: 24,
          textAlign: "center",
          fontWeight: 700,
          fontSize: "0.9375rem",
          fontVariantNumeric: "tabular-nums"
        }}
      >
        {value}
      </Typography>
      <StepButton
        ariaLabel={`Increase quantity for ${label}`}
        disabled={value >= MAX_QUANTITY}
        onClick={() => {
          onChange(value + 1);
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </StepButton>
    </Stack>
  );
}

interface StepButtonProps {
  readonly ariaLabel: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactElement;
}

function StepButton({ ariaLabel, disabled, onClick, children }: StepButtonProps): ReactElement {
  return (
    <IconButton
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 30,
        height: 30,
        color: "text.secondary",
        "&:hover": { bgcolor: "action.hover", color: "text.primary" }
      }}
    >
      {children}
    </IconButton>
  );
}
