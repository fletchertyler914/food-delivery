import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { paths } from "../../app/paths";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CoverImage } from "../../components/CoverImage";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PriceTag } from "../../components/PriceTag";
import { SectionHeader } from "../../components/SectionHeader";
import { StatusBadge } from "../../components/StatusBadge";
import { duplicateOrder, updateOrderStatus } from "../../lib/api/orders.api";
import type { OrderStatus } from "../../lib/api/types";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { formatCents } from "../../lib/format/currency";
import { formatDateTime, shortId } from "../../lib/format/datetime";
import { ArrowBackIcon, CheckCircleIcon } from "../../lib/icons";
import {
  canTransition,
  formatActorRole,
  formatStatusLabel,
  getAvailableTransitions,
  orderPerspectives,
  statusActionCopy
} from "../../lib/orders/order-status-machine";
import { useDocumentTitle } from "../../lib/use-document-title";
import { useAuthStore } from "../auth/auth.store";
import { orderEventsQuery, orderQuery, ordersKeys } from "./queries";

function formatReorderToast(droppedMealNames: readonly string[]): string {
  const dropped =
    droppedMealNames.length > 0 ? ` — ${droppedMealNames.join(", ")} unavailable` : "";
  return `Order reordered${dropped}`;
}

export function OrderDetailPage(): ReactElement {
  const { orderId = "" } = useParams();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const order = useQuery(orderQuery(orderId));
  const events = useQuery(orderEventsQuery(orderId));

  useDocumentTitle(order.data ? `Order #${shortId(order.data.id)}` : "Order");

  const statusMutation = useMutation({
    mutationFn: (toStatus: OrderStatus) => updateOrderStatus(orderId, toStatus),
    onSuccess: async (updated) => {
      queryClient.setQueryData(ordersKeys.detail(orderId), updated);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersKeys.all() }),
        queryClient.invalidateQueries({ queryKey: ordersKeys.events(orderId) })
      ]);
      enqueueSnackbar(`Order is now "${formatStatusLabel(updated.status)}"`, {
        variant: "success"
      });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateOrder(orderId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all() });
      enqueueSnackbar(formatReorderToast(result.droppedMealNames), { variant: "info" });
      void navigate(paths.order(result.order.id));
    }
  });

  if (order.isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (order.isError) {
    return (
      <ErrorPanel
        message={getErrorMessage(order.error, "Could not load this order.")}
        onRetry={() => {
          void order.refetch();
        }}
      />
    );
  }

  if (!order.data || !user) {
    return <ErrorPanel message="Order not found." />;
  }

  const data = order.data;
  const perspectives = orderPerspectives({
    customerId: data.customerId,
    restaurantOwnerId: data.restaurant.ownerId,
    actorId: user.id
  });
  const transitions = getAvailableTransitions(data.status, perspectives);
  const canDuplicate = data.customerId === user.id && data.status === "RECEIVED";
  const isRestaurantOperator = perspectives.has("OWNER");
  const eventList = events.data ?? [];

  return (
    <Stack spacing={4}>
      <Button
        component={Link}
        to={paths.orders}
        startIcon={<ArrowBackIcon />}
        size="small"
        sx={{ alignSelf: "flex-start", color: "text.secondary" }}
      >
        Back to orders
      </Button>

      <Card sx={{ overflow: "hidden", "&:hover": { transform: "none" } }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems="stretch">
          <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>
            <CoverImage
              src={data.restaurant.imageUrl}
              seed={data.restaurant.name}
              alt={data.restaurant.name}
              height={{ xs: 180, md: "100%" }}
              rounded={false}
            />
          </Box>
          <Box flex={1} sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                >
                  Order #{shortId(data.id)}
                </Typography>
                <StatusBadge status={data.status} />
              </Stack>
              <Typography variant="h3" component="h1">
                {data.restaurant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Placed {formatDateTime(data.placedAt)}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems="baseline" gap={2} mt={1.5}>
                <PriceTag cents={data.totalCents} size="lg" emphasis />
                <Typography variant="body2" color="text.secondary">
                  {data.items.length} item{data.items.length === 1 ? "" : "s"}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Card>

      <Stack direction={{ xs: "column", md: "row" }} gap={3}>
        <Card sx={{ flex: 1, p: 3, "&:hover": { transform: "none" } }}>
          <SectionHeader title="Items" />
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {data.items.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
              >
                <Stack minWidth={0} flex={1}>
                  <Typography variant="body1" fontWeight={600}>
                    {item.nameSnapshot}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Qty {item.quantity} · {formatCents(item.priceCentsSnapshot)} each
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} sx={{ fontFeatureSettings: '"tnum"' }}>
                  {formatCents(item.priceCentsSnapshot * item.quantity)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        <Card sx={{ flexBasis: { md: 320 }, p: 3, "&:hover": { transform: "none" } }}>
          <SectionHeader title="Receipt" />
          <Stack spacing={1.25}>
            <ReceiptRow label="Subtotal" value={formatCents(data.subtotalCents)} />
            {data.discountCents > 0 ? (
              <ReceiptRow
                label="Discount"
                value={`−${formatCents(data.discountCents)}`}
                tone="success"
              />
            ) : null}
            <ReceiptRow label="Tip" value={formatCents(data.tipCents)} />
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="subtitle1" fontWeight={700}>
                Total
              </Typography>
              <PriceTag cents={data.totalCents} size="md" emphasis />
            </Stack>
          </Stack>
        </Card>
      </Stack>

      <Card sx={{ p: 3, "&:hover": { transform: "none" } }}>
        <SectionHeader title="Timeline" description="Every status change for this order." />
        {events.isLoading ? (
          <TimelineSkeleton />
        ) : events.isError ? (
          <Alert severity="warning">
            {getErrorMessage(events.error, "Could not load order timeline.")}
          </Alert>
        ) : eventList.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No status events recorded yet.
          </Typography>
        ) : (
          <Stack
            spacing={3}
            sx={{
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 11,
                top: 6,
                bottom: 6,
                width: "2px",
                bgcolor: "divider"
              }
            }}
          >
            {eventList.map((event) => (
              <Stack
                key={event.id}
                direction="row"
                gap={2}
                alignItems="flex-start"
                sx={{ position: "relative", zIndex: 1 }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    flexShrink: 0
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 16 }} />
                </Box>
                <Stack gap={0.25}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {event.fromStatus
                      ? `${formatStatusLabel(event.fromStatus)} → ${formatStatusLabel(event.toStatus)}`
                      : formatStatusLabel(event.toStatus)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(event.createdAt)} · by {formatActorRole(event.actorRole)}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </Card>

      {(transitions.length > 0 || canDuplicate) && (
        <Card sx={{ p: 3, "&:hover": { transform: "none" } }}>
          <SectionHeader
            title="Actions"
            description={
              isRestaurantOperator
                ? "Move this order forward as you prepare and deliver it."
                : "Confirm delivery once it arrives, or place this order again."
            }
          />
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {transitions.map(({ toStatus }) => {
              const decision = canTransition(data.status, toStatus, perspectives);
              const copy = statusActionCopy(toStatus);
              const disabled = statusMutation.isPending;
              const isCancel = toStatus === "CANCELED";

              return (
                <Tooltip
                  key={toStatus}
                  title={decision.allowed ? copy.description : decision.reason}
                >
                  <span>
                    <Button
                      variant={isCancel ? "outlined" : "contained"}
                      color="primary"
                      size="medium"
                      disabled={disabled || !decision.allowed}
                      onClick={() => {
                        if (isCancel) {
                          setCancelConfirmOpen(true);
                        } else {
                          statusMutation.mutate(toStatus);
                        }
                      }}
                    >
                      {copy.label}
                    </Button>
                  </span>
                </Tooltip>
              );
            })}
            {canDuplicate ? (
              <Button
                variant="outlined"
                size="medium"
                disabled={duplicateMutation.isPending}
                onClick={() => {
                  duplicateMutation.mutate();
                }}
              >
                Reorder
              </Button>
            ) : null}
          </Stack>
          {statusMutation.isError ? (
            <Box sx={{ mt: 2 }}>
              <ErrorPanel
                message={getErrorMessage(statusMutation.error, "Status update failed.")}
              />
            </Box>
          ) : null}
          {duplicateMutation.isError ? (
            <Box sx={{ mt: 2 }}>
              <ErrorPanel
                message={getErrorMessage(duplicateMutation.error, "Could not duplicate order.")}
              />
            </Box>
          ) : null}
        </Card>
      )}

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Cancel this order?"
        description="Once canceled, the restaurant won't prepare it. You can always place a new order."
        confirmLabel="Cancel order"
        loading={statusMutation.isPending}
        onClose={() => {
          if (!statusMutation.isPending) {
            setCancelConfirmOpen(false);
          }
        }}
        onConfirm={() => {
          statusMutation.mutate("CANCELED", {
            onSettled: () => {
              setCancelConfirmOpen(false);
            }
          });
        }}
      />
    </Stack>
  );
}

function TimelineSkeleton(): ReactElement {
  return (
    <Stack
      spacing={3}
      sx={{
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 11,
          top: 6,
          bottom: 6,
          width: "2px",
          bgcolor: "divider"
        }
      }}
    >
      {[0, 1, 2].map((index) => (
        <Stack
          key={index}
          direction="row"
          gap={2}
          alignItems="flex-start"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Skeleton variant="circular" width={24} height={24} />
          <Stack gap={0.75} flex={1}>
            <Skeleton variant="rounded" width="55%" height={18} />
            <Skeleton variant="rounded" width="35%" height={14} />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

interface ReceiptRowProps {
  readonly label: string;
  readonly value: string;
  readonly tone?: "default" | "success";
}

function ReceiptRow({ label, value, tone = "default" }: ReceiptRowProps): ReactElement {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        color={tone === "success" ? "success.main" : "text.primary"}
        sx={{ fontFeatureSettings: '"tnum"' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
