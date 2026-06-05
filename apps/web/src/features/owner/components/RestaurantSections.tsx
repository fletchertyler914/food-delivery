import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router";

import { paths } from "../../../app/paths";
import { CoverImage } from "../../../components/CoverImage";
import { createRestaurant } from "../../../lib/api/restaurants.api";
import { applyApiFormError } from "../../../lib/forms/apply-api-form-error";
import { ExpandMoreIcon, OpenInNewIcon } from "../../../lib/icons";
import { restaurantsKeys } from "../../restaurants/queries";
import { restaurantSchema, type RestaurantFormValues } from "../owner.schemas";
import { ownerKeys } from "../queries";
import { CouponsSection } from "./CouponsSection";
import { MealsSection } from "./MealsSection";

interface NewRestaurantDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function NewRestaurantDialog({ open, onClose }: NewRestaurantDialogProps): ReactElement {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { name: "", description: "", imageUrl: "" }
  });

  const createRestaurantMutation = useMutation({
    mutationFn: (values: RestaurantFormValues) =>
      createRestaurant({
        name: values.name.trim(),
        description: values.description.trim(),
        ...(values.imageUrl?.trim() ? { imageUrl: values.imageUrl.trim() } : {})
      }),
    onSuccess: async (_data, variables) => {
      reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ownerKeys.restaurants() }),
        queryClient.invalidateQueries({ queryKey: restaurantsKeys.all() })
      ]);
      enqueueSnackbar(`${variables.name.trim()} is live.`, { variant: "success" });
      onClose();
    },
    onError: (error) => {
      applyApiFormError(error, setError, {}, "Could not create restaurant.");
    }
  });

  function close(): void {
    if (createRestaurantMutation.isPending) {
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
            createRestaurantMutation.mutate(values);
          })(event);
        }}
      >
        <DialogTitle>New restaurant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            {errors.root?.message ? <Alert severity="error">{errors.root.message}</Alert> : null}
            <TextField
              label="Name"
              autoFocus
              {...register("name")}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              fullWidth
            />
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
              helperText={errors.imageUrl?.message ?? "Optional. Use any HTTPS image URL."}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} width="100%">
            <Button onClick={close} disabled={createRestaurantMutation.isPending} fullWidth={isXs}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createRestaurantMutation.isPending}
              fullWidth={isXs}
            >
              Create restaurant
            </Button>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

interface RestaurantRowProps {
  readonly restaurantId: string;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function RestaurantRow({
  restaurantId,
  name,
  description,
  imageUrl,
  expanded,
  onToggle
}: RestaurantRowProps): ReactElement {
  return (
    <Card sx={{ overflow: "hidden", "&:hover": { transform: "none" } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        sx={{ p: { xs: 2, sm: 2.25 } }}
      >
        <Box sx={{ width: { xs: "100%", sm: 88 }, flexShrink: 0 }}>
          <CoverImage src={imageUrl} seed={name} alt={name} ratio={1} rounded={2} />
        </Box>
        <Stack flex={1} minWidth={0} gap={0.25}>
          <Typography variant="subtitle1" fontWeight={700}>
            {name}
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
            {description}
          </Typography>
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={1}
          flexShrink={0}
          sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
        >
          <Button
            component={RouterLink}
            to={paths.restaurant(restaurantId)}
            size="small"
            color="inherit"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            sx={{ color: "text.secondary", width: { xs: "100%", sm: "auto" } }}
          >
            View live
          </Button>
          <Button
            size="small"
            variant={expanded ? "contained" : "outlined"}
            onClick={onToggle}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transition: "transform 0.2s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
                }}
              />
            }
          >
            Manage meals
          </Button>
        </Stack>
      </Stack>
      <Collapse in={expanded} timeout="auto" mountOnEnter unmountOnExit>
        <Divider />
        <Box sx={{ bgcolor: "grey.50", p: { xs: 2, sm: 3 } }}>
          <RestaurantManagePanel restaurantId={restaurantId} restaurantName={name} />
        </Box>
      </Collapse>
    </Card>
  );
}

interface RestaurantManagePanelProps {
  readonly restaurantId: string;
  readonly restaurantName: string;
}

export function RestaurantManagePanel({
  restaurantId,
  restaurantName
}: RestaurantManagePanelProps): ReactElement {
  return (
    <Stack spacing={4}>
      <MealsSection restaurantId={restaurantId} restaurantName={restaurantName} />
      <Divider />
      <CouponsSection restaurantId={restaurantId} />
    </Stack>
  );
}
