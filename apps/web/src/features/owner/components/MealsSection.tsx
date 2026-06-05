import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CoverImage } from "../../../components/CoverImage";
import { ErrorPanel } from "../../../components/ErrorPanel";
import { SectionHeader } from "../../../components/SectionHeader";
import {
  createMeal,
  deactivateMeal,
  reactivateMeal,
  updateMeal
} from "../../../lib/api/restaurants.api";
import type { Meal } from "../../../lib/api/types";
import { getErrorMessage } from "../../../lib/errors/get-error-message";
import { formatCents } from "../../../lib/format/currency";
import { applyApiFormError } from "../../../lib/forms/apply-api-form-error";
import { PlusIcon } from "../../../lib/icons";
import { ownerMenuQuery, restaurantsKeys } from "../../restaurants/queries";
import { centsToDollars, dollarsToCents, mealSchema, type MealFormValues } from "../owner.schemas";

interface MealsSectionProps {
  readonly restaurantId: string;
  readonly restaurantName: string;
}

export function MealsSection({ restaurantId, restaurantName }: MealsSectionProps): ReactElement {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [pendingDeactivateMeal, setPendingDeactivateMeal] = useState<{
    readonly id: string;
    readonly name: string;
  } | null>(null);
  const [mealDialog, setMealDialog] = useState<
    { readonly mode: "create" } | { readonly mode: "edit"; readonly meal: Meal } | null
  >(null);

  const meals = useQuery(ownerMenuQuery(restaurantId));

  async function invalidateMenus(): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: restaurantsKeys.ownerMenu(restaurantId) }),
      queryClient.invalidateQueries({ queryKey: restaurantsKeys.publicMenu(restaurantId) })
    ]);
  }

  const deactivateMealMutation = useMutation({
    mutationFn: ({ id }: { readonly id: string; readonly name: string }) => deactivateMeal(id),
    onSuccess: async (_data, variables) => {
      await invalidateMenus();
      enqueueSnackbar(`${variables.name} is no longer available.`, { variant: "info" });
      setPendingDeactivateMeal(null);
    }
  });

  const reactivateMealMutation = useMutation({
    mutationFn: ({ id }: { readonly id: string; readonly name: string }) => reactivateMeal(id),
    onSuccess: async (_data, variables) => {
      await invalidateMenus();
      enqueueSnackbar(`${variables.name} is back on the menu.`, { variant: "success" });
    }
  });

  const items = meals.data ?? [];

  return (
    <Stack spacing={2}>
      <SectionHeader
        title={`Meals for ${restaurantName}`}
        description="Add new meals, edit details, or deactivate ones that are no longer available."
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlusIcon />}
            onClick={() => {
              setMealDialog({ mode: "create" });
            }}
          >
            Add meal
          </Button>
        }
      />

      <Stack spacing={1}>
        {meals.isLoading ? (
          <MealRowSkeletonList />
        ) : meals.isError ? (
          <ErrorPanel
            message={getErrorMessage(meals.error, "Could not load meals.")}
            onRetry={() => {
              void meals.refetch();
            }}
          />
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No meals yet — add the first one with the button above.
          </Typography>
        ) : (
          <Card variant="outlined" sx={{ "&:hover": { transform: "none" } }}>
            <Stack divider={<Divider flexItem />}>
              {items.map((meal) => (
                <Stack
                  key={meal.id}
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  gap={2}
                  sx={{ p: 2 }}
                >
                  <Box sx={{ width: { xs: 64, sm: 56 }, flexShrink: 0 }}>
                    <CoverImage
                      src={meal.imageUrl}
                      seed={meal.name}
                      alt={meal.name}
                      ratio={1}
                      rounded={1.5}
                    />
                  </Box>
                  <Stack flex={1} minWidth={0} gap={0.25}>
                    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="body1" fontWeight={600}>
                        {meal.name}
                      </Typography>
                      {!meal.isActive ? <Chip label="Inactive" size="small" /> : null}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {meal.description}
                    </Typography>
                  </Stack>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    gap={1}
                    flexShrink={0}
                    sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        fontFeatureSettings: '"tnum"',
                        minWidth: 64,
                        textAlign: { xs: "left", sm: "right" }
                      }}
                    >
                      {formatCents(meal.priceCents)}
                    </Typography>
                    <Button
                      size="medium"
                      color="inherit"
                      sx={{ color: "text.secondary" }}
                      onClick={() => {
                        setMealDialog({ mode: "edit", meal });
                      }}
                    >
                      Edit
                    </Button>
                    {meal.isActive ? (
                      <Button
                        size="medium"
                        color="inherit"
                        sx={{ color: "text.secondary" }}
                        disabled={deactivateMealMutation.isPending}
                        onClick={() => {
                          setPendingDeactivateMeal({ id: meal.id, name: meal.name });
                        }}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="medium"
                        variant="outlined"
                        disabled={reactivateMealMutation.isPending}
                        onClick={() => {
                          reactivateMealMutation.mutate({ id: meal.id, name: meal.name });
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>

      <MealFormDialog
        open={mealDialog !== null}
        mode={mealDialog?.mode ?? "create"}
        {...(mealDialog?.mode === "edit" ? { meal: mealDialog.meal } : {})}
        restaurantId={restaurantId}
        onClose={() => {
          setMealDialog(null);
        }}
        onSuccess={async () => {
          await invalidateMenus();
          setMealDialog(null);
        }}
      />

      <ConfirmDialog
        open={pendingDeactivateMeal !== null}
        title="Deactivate this meal?"
        description="Customers won't see this meal on your menu anymore. Past orders are unaffected."
        confirmLabel="Deactivate"
        confirmColor="warning"
        loading={deactivateMealMutation.isPending}
        onClose={() => {
          if (!deactivateMealMutation.isPending) {
            setPendingDeactivateMeal(null);
          }
        }}
        onConfirm={() => {
          if (pendingDeactivateMeal !== null) {
            deactivateMealMutation.mutate(pendingDeactivateMeal);
          }
        }}
      />
    </Stack>
  );
}

interface MealFormDialogProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly meal?: Meal;
  readonly restaurantId: string;
  readonly onClose: () => void;
  readonly onSuccess: () => Promise<void>;
}

export function MealFormDialog({
  open,
  mode,
  meal,
  restaurantId,
  onClose,
  onSuccess
}: MealFormDialogProps): ReactElement {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const { enqueueSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { name: "", description: "", price: "", imageUrl: "" }
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (mode === "edit" && meal !== undefined) {
      reset({
        name: meal.name,
        description: meal.description,
        price: centsToDollars(meal.priceCents),
        imageUrl: meal.imageUrl ?? ""
      });
      return;
    }
    reset({ name: "", description: "", price: "", imageUrl: "" });
  }, [open, mode, meal, reset]);

  const createMealMutation = useMutation({
    mutationFn: (values: MealFormValues) =>
      createMeal(restaurantId, {
        name: values.name.trim(),
        description: values.description.trim(),
        priceCents: dollarsToCents(values.price),
        ...(values.imageUrl?.trim() ? { imageUrl: values.imageUrl.trim() } : {})
      }),
    onSuccess: async (_data, variables) => {
      reset();
      await onSuccess();
      enqueueSnackbar(`${variables.name.trim()} is on the menu.`, { variant: "success" });
    },
    onError: (error) => {
      applyApiFormError(error, setError, {}, "Could not create meal.");
    }
  });

  const updateMealMutation = useMutation({
    mutationFn: (values: MealFormValues) => {
      if (meal === undefined) {
        throw new Error("Meal is required for edit mode.");
      }
      return updateMeal(meal.id, {
        name: values.name.trim(),
        description: values.description.trim(),
        priceCents: dollarsToCents(values.price),
        ...(values.imageUrl?.trim() ? { imageUrl: values.imageUrl.trim() } : {})
      });
    },
    onSuccess: async (_data, variables) => {
      reset();
      await onSuccess();
      enqueueSnackbar(`${variables.name.trim()} has been updated.`, { variant: "success" });
    },
    onError: (error) => {
      applyApiFormError(error, setError, {}, "Could not update meal.");
    }
  });

  const isPending = createMealMutation.isPending || updateMealMutation.isPending;

  function close(): void {
    if (isPending) {
      return;
    }
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth fullScreen={isXs}>
      <Box
        component="form"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            if (mode === "create") {
              createMealMutation.mutate(values);
              return;
            }
            updateMealMutation.mutate(values);
          })(event);
        }}
      >
        <DialogTitle>{mode === "create" ? "Add meal" : "Edit meal"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}>
              <TextField
                label="Name"
                autoFocus
                {...register("name")}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Price"
                placeholder="12.99"
                inputMode="decimal"
                {...register("price")}
                error={Boolean(errors.price)}
                helperText={errors.price?.message}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }
                }}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label="Description"
              {...register("description")}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Cover image URL"
              placeholder="https://…"
              {...register("imageUrl")}
              error={Boolean(errors.imageUrl)}
              helperText={errors.imageUrl?.message ?? "Optional."}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} width="100%">
            <Button onClick={close} disabled={isPending} fullWidth={isXs}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isPending} fullWidth={isXs}>
              {mode === "create" ? "Add meal" : "Save changes"}
            </Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export function MealRowSkeletonList(): ReactElement {
  return (
    <Card variant="outlined" sx={{ "&:hover": { transform: "none" } }}>
      <Stack divider={<Divider flexItem />}>
        {[0, 1, 2].map((index) => (
          <Stack key={index} direction="row" alignItems="center" gap={2} sx={{ p: 2 }}>
            <Skeleton variant="rounded" width={56} height={56} />
            <Stack flex={1} gap={0.75}>
              <Skeleton variant="rounded" width="45%" height={20} />
              <Skeleton variant="rounded" width="70%" height={16} />
            </Stack>
            <Skeleton variant="rounded" width={88} height={36} />
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
