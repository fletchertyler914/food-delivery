import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { ErrorPanel } from "../../../components/ErrorPanel";
import { SectionHeader } from "../../../components/SectionHeader";
import { createCoupon, deactivateCoupon } from "../../../lib/api/coupons.api";
import { getErrorMessage } from "../../../lib/errors/get-error-message";
import { applyApiFormError } from "../../../lib/forms/apply-api-form-error";
import { alphaToken } from "../../../theme/css-vars";
import { couponSchema, type CouponFormValues } from "../owner.schemas";
import { ownerCouponsQuery, ownerKeys } from "../queries";

interface CouponsSectionProps {
  readonly restaurantId: string;
}

export function CouponsSection({ restaurantId }: CouponsSectionProps): ReactElement {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [pendingDeactivateCoupon, setPendingDeactivateCoupon] = useState<{
    readonly id: string;
    readonly code: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: { code: "", percentOff: 10 }
  });

  const coupons = useQuery(ownerCouponsQuery(restaurantId));

  const createCouponMutation = useMutation({
    mutationFn: (values: CouponFormValues) =>
      createCoupon(restaurantId, { code: values.code, percentOff: values.percentOff }),
    onSuccess: async (_data, variables) => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ownerKeys.coupons(restaurantId) });
      enqueueSnackbar(`Coupon ${variables.code} is live.`, { variant: "success" });
    },
    onError: (error) => {
      applyApiFormError(error, setError, { COUPON_CODE_TAKEN: "code" }, "Could not create coupon.");
    }
  });

  const deactivateCouponMutation = useMutation({
    mutationFn: ({ id }: { readonly id: string; readonly code: string }) => deactivateCoupon(id),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ownerKeys.coupons(restaurantId) });
      enqueueSnackbar(`Coupon ${variables.code} has been retired.`, { variant: "info" });
      setPendingDeactivateCoupon(null);
    }
  });

  const items = coupons.data ?? [];

  return (
    <Stack spacing={2}>
      <SectionHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
      />

      <Stack spacing={1}>
        {coupons.isLoading ? (
          <CouponRowSkeletonList />
        ) : coupons.isError ? (
          <ErrorPanel
            message={getErrorMessage(coupons.error, "Could not load coupons.")}
            onRetry={() => {
              void coupons.refetch();
            }}
          />
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No coupons yet — add one below.
          </Typography>
        ) : (
          <Card variant="outlined" sx={{ "&:hover": { transform: "none" } }}>
            <Stack divider={<Divider flexItem />}>
              {items.map((coupon) => (
                <Stack
                  key={coupon.id}
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  gap={2}
                  sx={{ p: 2 }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5} minWidth={0}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        bgcolor: (t) => alphaToken(t, "primary.main", 0.08),
                        color: "primary.dark",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      {coupon.code}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coupon.percentOff}% off
                    </Typography>
                    {!coupon.isActive ? <Chip label="Inactive" size="small" /> : null}
                  </Stack>
                  {coupon.isActive ? (
                    <Button
                      size="medium"
                      color="inherit"
                      sx={{ color: "text.secondary", width: { xs: "100%", sm: "auto" } }}
                      disabled={deactivateCouponMutation.isPending}
                      onClick={() => {
                        setPendingDeactivateCoupon({ id: coupon.id, code: coupon.code });
                      }}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>

      <Card
        component="form"
        variant="outlined"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            createCouponMutation.mutate(values);
          })(event);
        }}
        sx={{ p: 2.5, "&:hover": { transform: "none" } }}
      >
        <Stack spacing={2}>
          <Typography variant="overline" color="text.secondary">
            Add coupon
          </Typography>
          {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}
          <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems="flex-start">
            <TextField
              label="Coupon code"
              {...register("code")}
              error={Boolean(errors.code)}
              helperText={
                errors.code?.message ?? "Uppercase letters, digits, hyphen, or underscore."
              }
              sx={{ flex: 2 }}
            />
            <TextField
              label="Percent off"
              type="number"
              {...register("percentOff", { valueAsNumber: true })}
              error={Boolean(errors.percentOff)}
              helperText={errors.percentOff?.message}
              sx={{ flex: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={createCouponMutation.isPending}
              sx={{ mt: { xs: 0, md: 0.25 }, alignSelf: { xs: "stretch", md: "flex-start" } }}
            >
              Add coupon
            </Button>
          </Stack>
        </Stack>
      </Card>

      <ConfirmDialog
        open={pendingDeactivateCoupon !== null}
        title="Retire this coupon?"
        description="Existing orders that already used it stay valid. New checkouts can't redeem the code."
        confirmLabel="Retire coupon"
        confirmColor="warning"
        loading={deactivateCouponMutation.isPending}
        onClose={() => {
          if (!deactivateCouponMutation.isPending) {
            setPendingDeactivateCoupon(null);
          }
        }}
        onConfirm={() => {
          if (pendingDeactivateCoupon !== null) {
            deactivateCouponMutation.mutate(pendingDeactivateCoupon);
          }
        }}
      />
    </Stack>
  );
}

export function CouponRowSkeletonList(): ReactElement {
  return (
    <Card variant="outlined" sx={{ "&:hover": { transform: "none" } }}>
      <Stack divider={<Divider flexItem />}>
        {[0, 1, 2].map((index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
            sx={{ p: 2 }}
          >
            <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
              <Skeleton variant="rounded" width={96} height={28} />
              <Skeleton variant="rounded" width={72} height={18} />
            </Stack>
            <Skeleton variant="rounded" width={100} height={36} />
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
