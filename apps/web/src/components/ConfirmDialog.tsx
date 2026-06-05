import Button from "@mui/material/Button";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import type { TransitionProps } from "@mui/material/transitions";
import useMediaQuery from "@mui/material/useMediaQuery";
import { forwardRef, type ReactElement, type ReactNode, type Ref } from "react";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description?: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly confirmColor?: "primary" | "error" | "warning";
  readonly loading?: boolean;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

// Slide-up keeps the bottom-sheet feel native on mobile and reads as a
// standard modal entrance on desktop. We only apply it on xs to avoid
// fighting the centered Fade on larger viewports.
const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: ReactElement<unknown, string> },
  ref: Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep things as is",
  confirmColor = "primary",
  loading = false,
  onConfirm,
  onClose
}: ConfirmDialogProps): ReactElement {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));

  const slots: DialogProps["slots"] = isXs ? { transition: SlideUpTransition } : {};
  const slotProps: DialogProps["slotProps"] = isXs
    ? {
        container: { sx: { alignItems: "flex-end" } },
        paper: {
          sx: {
            m: 0,
            width: "100%",
            maxWidth: "100%",
            borderRadius: 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            pb: "env(safe-area-inset-bottom, 0px)"
          }
        }
      }
    : {};

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slots={slots}
      slotProps={slotProps}
    >
      {isXs ? (
        <Stack
          aria-hidden
          sx={{
            alignItems: "center",
            pt: 1,
            pb: 0.5
          }}
        >
          <Stack
            sx={{
              width: 36,
              height: 4,
              borderRadius: 999,
              bgcolor: "divider"
            }}
          />
        </Stack>
      ) : null}
      <DialogTitle sx={{ pb: description ? 1 : 2 }}>{title}</DialogTitle>
      {description ? (
        <DialogContent sx={{ pb: 1.5 }}>
          <DialogContentText>{description}</DialogContentText>
        </DialogContent>
      ) : null}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          gap={1}
          width="100%"
          justifyContent={{ sm: "flex-end" }}
        >
          <Button onClick={onClose} disabled={loading} fullWidth={isXs}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={confirmColor}
            onClick={onConfirm}
            disabled={loading}
            fullWidth={isXs}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
