import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { paths } from "../../app/paths";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CoverImage } from "../../components/CoverImage";
import { EmptyState } from "../../components/EmptyState";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PageHeader } from "../../components/PageHeader";
import { PriceTag } from "../../components/PriceTag";
import { StatusBadge } from "../../components/StatusBadge";
import { duplicateOrder } from "../../lib/api/orders.api";
import { formatStatusLabel, type OrderStatus } from "../../lib/orders/order-status-machine";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { formatRelative, shortId } from "../../lib/format/datetime";
import { LocalShippingIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { useAuthStore } from "../auth/auth.store";
import { ordersKeys, ordersListQuery } from "./queries";

// Lifecycle order: Placed → Preparing → Out for delivery → Delivered →
// Received, with the side-step terminal status (Canceled) pinned to the
// end so the filter row reads top-to-bottom like the state machine.
const OWNER_STATUS_FILTERS: readonly OrderStatus[] = [
  "PLACED",
  "PROCESSING",
  "IN_ROUTE",
  "DELIVERED",
  "RECEIVED",
  "CANCELED"
];

type StatusFilterValue = OrderStatus | "ALL";

function formatReorderToast(droppedMealNames: readonly string[]): string {
  const dropped =
    droppedMealNames.length > 0 ? ` — ${droppedMealNames.join(", ")} unavailable` : "";
  return `Order reordered${dropped}`;
}

export function OrdersPage(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const [reorderTargetId, setReorderTargetId] = useState<string | null>(null);

  const isOwner = user?.role === "OWNER";
  const isCustomer = user?.role === "CUSTOMER";
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  useDocumentTitle("Orders");

  const orders = useQuery(
    ordersListQuery({
      ...(statusFilter !== "ALL" && { status: [statusFilter] })
    })
  );

  const duplicateMutation = useMutation({
    mutationFn: (orderId: string) => duplicateOrder(orderId),
    onSuccess: (result) => {
      setReorderTargetId(null);
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all() });
      enqueueSnackbar(formatReorderToast(result.droppedMealNames), { variant: "info" });
      void navigate(paths.order(result.order.id));
    }
  });

  if (orders.isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (orders.isError) {
    return (
      <ErrorPanel
        message={getErrorMessage(orders.error, "Could not load orders.")}
        onRetry={() => {
          void orders.refetch();
        }}
      />
    );
  }

  const data = orders.data ?? [];

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow={isOwner ? "Kitchen" : "Account"}
        title="Orders"
        description={
          isOwner
            ? "Track every incoming order and move them through fulfillment."
            : "Your past orders, ready to track or reorder."
        }
      />

      {isOwner ? (
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            // Cancel the Container's xs gutter so the tab strip itself is
            // flush with both viewport edges — the swipeable scroll area
            // then uses the full screen width on mobile.
            mx: { xs: -2, sm: 0 }
          }}
        >
          <Tabs
            value={statusFilter}
            onChange={(_event, next: StatusFilterValue) => {
              setStatusFilter(next);
            }}
            variant="scrollable"
            // On touch devices we rely on horizontal swipe instead of
            // chevron buttons (which would otherwise eat into the strip's
            // usable width). Desktop still shows them on overflow.
            scrollButtons="auto"
            aria-label="order status filter"
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                minWidth: "auto",
                px: { xs: 1.5, sm: 2 },
                fontWeight: 600,
                fontSize: "0.8125rem",
                color: "text.secondary"
              },
              // Inset the first tab so the active underline isn't kissing
              // the viewport edge on mobile.
              "& .MuiTab-root:first-of-type": { ml: { xs: 1, sm: 0 } },
              "& .MuiTab-root:last-of-type": { mr: { xs: 1, sm: 0 } },
              "& .MuiTab-root.Mui-selected": { color: "primary.dark" },
              "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" }
            }}
          >
            <Tab value="ALL" label="All" />
            {OWNER_STATUS_FILTERS.map((status) => (
              <Tab key={status} value={status} label={formatStatusLabel(status)} />
            ))}
          </Tabs>
        </Box>
      ) : null}

      {data.length === 0 ? (
        <EmptyState
          icon={<LocalShippingIcon />}
          title={isOwner ? "No orders match this filter" : "No orders yet"}
          description={
            isOwner
              ? "Pick a different status above to see other orders."
              : "Browse a restaurant and add something to your cart to get started."
          }
          action={
            !isOwner ? (
              <Button component={Link} to={paths.restaurants} variant="contained">
                Browse restaurants
              </Button>
            ) : null
          }
        />
      ) : (
        <Stack spacing={{ xs: 1, sm: 2 }}>
          {data.map((order) => (
            <Card
              key={order.id}
              sx={{ overflow: "hidden", "&:hover": { borderColor: "primary.light" } }}
            >
              <Stack direction="row" alignItems="stretch">
                {/* The image column has no explicit height — it stretches
                    to the row's natural height (content + padding), so
                    every card fills its thumbnail edge-to-edge without
                    introducing whitespace below the content. */}
                <Box
                  sx={{
                    width: { xs: 88, sm: 160 },
                    flexShrink: 0,
                    alignSelf: "stretch"
                  }}
                >
                  <CoverImage
                    src={order.restaurant.imageUrl}
                    seed={order.restaurant.name}
                    alt={order.restaurant.name}
                    height="100%"
                    rounded={false}
                  />
                </Box>
                <CardActionArea
                  component={Link}
                  to={paths.order(order.id)}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    px: { xs: 1.5, sm: 3 },
                    py: { xs: 1.25, sm: 2 },
                    "&:hover": { backgroundColor: "transparent" }
                  }}
                >
                  <Stack spacing={{ xs: 0.25, sm: 0.5 }} sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1}
                      flexWrap="wrap"
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                        minWidth={0}
                      >
                        {/* The hash ID is useful for support context on
                            wider screens but takes scarce horizontal
                            room on mobile, where the restaurant name +
                            status already disambiguate the row. */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontFamily: "monospace",
                            letterSpacing: "0.05em",
                            display: { xs: "none", sm: "inline" }
                          }}
                        >
                          #{shortId(order.id)}
                        </Typography>
                        <StatusBadge status={order.status} />
                      </Stack>
                      <PriceTag cents={order.totalCents} size={isXs ? "sm" : "md"} emphasis />
                    </Stack>
                    <Typography
                      variant="h6"
                      component="p"
                      sx={{
                        fontSize: { xs: "0.9375rem", sm: "1.0625rem" },
                        lineHeight: 1.25
                      }}
                    >
                      {order.restaurant.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
                    >
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} · Placed{" "}
                      {formatRelative(order.placedAt)}
                    </Typography>
                    {order.discountCents > 0 ? (
                      <Typography variant="caption" color="success.main" fontWeight={600}>
                        Discount −{formatCentsForDisplay(order.discountCents)}
                      </Typography>
                    ) : null}
                    {isCustomer && order.status === "RECEIVED" ? (
                      <Box
                        sx={{
                          mt: { xs: 0.75, sm: 1.25 },
                          alignSelf: { xs: "stretch", sm: "flex-end" }
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={duplicateMutation.isPending}
                          fullWidth={isXs}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setReorderTargetId(order.id);
                          }}
                        >
                          Reorder
                        </Button>
                      </Box>
                    ) : null}
                  </Stack>
                </CardActionArea>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      {duplicateMutation.isError ? (
        <ErrorPanel
          message={getErrorMessage(duplicateMutation.error, "Could not duplicate order.")}
        />
      ) : null}

      <ConfirmDialog
        open={reorderTargetId !== null}
        title="Reorder this order?"
        description="We'll start a fresh order with the same items. Anything no longer available is skipped."
        confirmLabel={duplicateMutation.isPending ? "Placing order..." : "Confirm reorder"}
        cancelLabel="Cancel"
        loading={duplicateMutation.isPending}
        onClose={() => {
          setReorderTargetId(null);
        }}
        onConfirm={() => {
          if (reorderTargetId !== null) {
            duplicateMutation.mutate(reorderTargetId);
          }
        }}
      />
    </Stack>
  );
}

// Local helper to keep the discount line concise without pulling in a
// PriceTag (which would render a different size and weight).
function formatCentsForDisplay(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
