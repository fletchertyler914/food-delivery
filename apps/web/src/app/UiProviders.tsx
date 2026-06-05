import { styled, ThemeProvider } from "@mui/material/styles";
import { MaterialDesignContent, SnackbarProvider } from "notistack";
import type { PropsWithChildren, ReactElement } from "react";

import { theme } from "../theme/theme";
import { ColorSchemeBridge } from "./ColorSchemeBridge";

// Toasts mirror the rest of the design system: pill-radius matching
// cards/dialogs, the warm shadow scale, and the brand palette so the
// "Order placed" moment lands in saffron instead of stock Material
// green. Variants still carry semantic meaning — error stays red,
// warning amber, info teal (brand secondary).
const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme: t }) => ({
  borderRadius: 14,
  fontWeight: 600,
  letterSpacing: "0.01em",
  boxShadow: t.shadows[8],
  paddingInline: 16,
  paddingBlock: 10,
  fontFamily: t.typography.fontFamily,
  "&.notistack-MuiContent-success": {
    backgroundColor: t.palette.primary.main,
    color: t.palette.primary.contrastText
  },
  "&.notistack-MuiContent-info": {
    backgroundColor: t.palette.secondary.main,
    color: t.palette.secondary.contrastText
  },
  "&.notistack-MuiContent-warning": {
    backgroundColor: t.palette.warning.main,
    color: t.palette.warning.contrastText
  },
  "&.notistack-MuiContent-error": {
    backgroundColor: t.palette.error.main,
    color: t.palette.error.contrastText
  }
}));

// Single composition point for the visual + notification stack so the
// app and the test render helper render the same provider tree. Adding
// a new top-level UI provider only requires editing this file.
export function UiProviders({ children }: PropsWithChildren): ReactElement {
  return (
    <ThemeProvider theme={theme} defaultMode="system" modeStorageKey="fd-color-mode">
      <ColorSchemeBridge />
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        preventDuplicate
        Components={{
          success: StyledMaterialDesignContent,
          info: StyledMaterialDesignContent,
          warning: StyledMaterialDesignContent,
          error: StyledMaterialDesignContent
        }}
      >
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  );
}
