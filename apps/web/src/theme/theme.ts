import { createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

import { alphaToken, paletteVar } from "./css-vars";

// Saffron & Espresso — warm food-first identity. All feature colors
// must come from theme.palette.*, theme.shape.*, or theme.shadows[*].

const lightPalette = {
  primary: {
    main: "#EA580C",
    dark: "#C2410C",
    light: "#FB923C",
    contrastText: "#FFFFFF"
  },
  secondary: {
    main: "#14B8A6",
    dark: "#0F766E",
    light: "#5EEAD4",
    contrastText: "#FFFFFF"
  },
  success: {
    main: "#15803D",
    light: "#22C55E",
    dark: "#166534"
  },
  warning: {
    main: "#B45309",
    light: "#F59E0B",
    dark: "#92400E"
  },
  info: {
    main: "#0369A1",
    light: "#0EA5E9",
    dark: "#075985"
  },
  error: {
    main: "#B91C1C",
    light: "#EF4444",
    dark: "#991B1B"
  },
  background: {
    default: "#FBF7F0",
    paper: "#FFFFFF"
  },
  text: {
    primary: "#1C1917",
    secondary: "#57534E",
    disabled: "#A8A29E"
  },
  divider: "#E7E5E4",
  grey: {
    50: "#FAFAF9",
    100: "#F5F5F4",
    200: "#E7E5E4",
    300: "#D6D3D1",
    400: "#A8A29E",
    500: "#78716C",
    600: "#57534E",
    700: "#44403C",
    800: "#292524",
    900: "#1C1917"
  }
} as const;

const darkPalette = {
  primary: {
    main: "#FB923C",
    dark: "#EA580C",
    light: "#FDBA74",
    contrastText: "#1C1410"
  },
  secondary: {
    main: "#99F6E4",
    dark: "#5EEAD4",
    light: "#CCFBF1",
    contrastText: "#0B2A28"
  },
  success: {
    main: "#22C55E",
    light: "#4ADE80",
    dark: "#16A34A"
  },
  warning: {
    main: "#FBBF24",
    light: "#FCD34D",
    dark: "#F59E0B"
  },
  info: {
    main: "#38BDF8",
    light: "#7DD3FC",
    dark: "#0EA5E9"
  },
  error: {
    main: "#F87171",
    light: "#FCA5A5",
    dark: "#EF4444"
  },
  background: {
    default: "#1A1310",
    paper: "#251C18"
  },
  text: {
    primary: "#FAFAF9",
    secondary: "#B8B0AB",
    disabled: "#78716C"
  },
  divider: "#3A2D26",
  grey: {
    50: "#1C1917",
    100: "#292524",
    200: "#44403C",
    300: "#57534E",
    400: "#78716C",
    500: "#A8A29E",
    600: "#D6D3D1",
    700: "#E7E5E4",
    800: "#F5F5F4",
    900: "#FAFAF9"
  }
} as const;

// Tailwind-inspired soft shadow scale. MUI requires exactly 25 entries.
const elevation = [
  "none",
  "0 1px 2px 0 rgba(15, 17, 21, 0.04)",
  "0 1px 3px 0 rgba(15, 17, 21, 0.08), 0 1px 2px -1px rgba(15, 17, 21, 0.04)",
  "0 2px 4px -1px rgba(15, 17, 21, 0.08), 0 1px 3px -2px rgba(15, 17, 21, 0.04)",
  "0 4px 6px -1px rgba(15, 17, 21, 0.08), 0 2px 4px -2px rgba(15, 17, 21, 0.04)",
  "0 6px 10px -2px rgba(15, 17, 21, 0.10), 0 2px 4px -2px rgba(15, 17, 21, 0.04)",
  "0 10px 15px -3px rgba(15, 17, 21, 0.10), 0 4px 6px -4px rgba(15, 17, 21, 0.04)",
  "0 12px 20px -4px rgba(15, 17, 21, 0.12), 0 6px 8px -4px rgba(15, 17, 21, 0.04)",
  "0 14px 22px -4px rgba(15, 17, 21, 0.13), 0 6px 10px -4px rgba(15, 17, 21, 0.05)",
  "0 16px 24px -6px rgba(15, 17, 21, 0.14), 0 6px 12px -6px rgba(15, 17, 21, 0.06)",
  "0 18px 28px -8px rgba(15, 17, 21, 0.15), 0 8px 14px -6px rgba(15, 17, 21, 0.07)",
  "0 20px 30px -8px rgba(15, 17, 21, 0.16), 0 10px 16px -6px rgba(15, 17, 21, 0.07)",
  "0 22px 32px -10px rgba(15, 17, 21, 0.18), 0 10px 18px -8px rgba(15, 17, 21, 0.08)",
  "0 24px 34px -10px rgba(15, 17, 21, 0.18), 0 12px 20px -8px rgba(15, 17, 21, 0.08)",
  "0 26px 36px -12px rgba(15, 17, 21, 0.20), 0 12px 22px -10px rgba(15, 17, 21, 0.09)",
  "0 28px 38px -12px rgba(15, 17, 21, 0.20), 0 14px 24px -10px rgba(15, 17, 21, 0.10)",
  "0 30px 40px -14px rgba(15, 17, 21, 0.22), 0 14px 26px -12px rgba(15, 17, 21, 0.10)",
  "0 32px 42px -14px rgba(15, 17, 21, 0.22), 0 16px 28px -12px rgba(15, 17, 21, 0.11)",
  "0 34px 44px -16px rgba(15, 17, 21, 0.24), 0 16px 30px -14px rgba(15, 17, 21, 0.11)",
  "0 36px 46px -16px rgba(15, 17, 21, 0.24), 0 18px 32px -14px rgba(15, 17, 21, 0.12)",
  "0 38px 48px -18px rgba(15, 17, 21, 0.26), 0 18px 34px -16px rgba(15, 17, 21, 0.12)",
  "0 40px 50px -18px rgba(15, 17, 21, 0.26), 0 20px 36px -16px rgba(15, 17, 21, 0.13)",
  "0 42px 52px -20px rgba(15, 17, 21, 0.28), 0 20px 38px -18px rgba(15, 17, 21, 0.13)",
  "0 44px 54px -20px rgba(15, 17, 21, 0.28), 0 22px 40px -18px rgba(15, 17, 21, 0.14)",
  "0 46px 56px -22px rgba(15, 17, 21, 0.30), 0 22px 42px -20px rgba(15, 17, 21, 0.14)"
] as const;

const fontFamily = ['"Inter Variable"', '"Inter"', '"Roboto"', "system-ui", "sans-serif"].join(",");

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data"
  },
  colorSchemes: {
    light: { palette: lightPalette },
    dark: { palette: darkPalette }
  },
  shape: {
    borderRadius: 14
  },
  shadows: elevation as unknown as ReturnType<typeof createTheme>["shadows"],
  typography: {
    fontFamily,
    fontSize: 15,
    h1: {
      fontFamily,
      fontWeight: 800,
      fontSize: "2.25rem",
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      "@media (min-width:600px)": {
        fontSize: "3rem"
      }
    },
    h2: {
      fontFamily,
      fontWeight: 800,
      fontSize: "1.625rem",
      lineHeight: 1.15,
      letterSpacing: "-0.02em",
      "@media (min-width:600px)": {
        fontSize: "2.25rem"
      }
    },
    h3: {
      fontFamily,
      fontWeight: 700,
      fontSize: "1.375rem",
      lineHeight: 1.2,
      letterSpacing: "-0.015em",
      "@media (min-width:600px)": {
        fontSize: "1.875rem"
      }
    },
    h4: {
      fontFamily,
      fontWeight: 700,
      fontSize: "1.25rem",
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
      "@media (min-width:600px)": {
        fontSize: "1.5rem"
      }
    },
    h5: { fontFamily, fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.3 },
    h6: { fontFamily, fontWeight: 600, fontSize: "1.0625rem", lineHeight: 1.35 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.01em" },
    body1: { fontSize: "0.9375rem", lineHeight: 1.55 },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    caption: { fontSize: "0.75rem", lineHeight: 1.4 },
    overline: { fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.6875rem" }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (themeParam: Theme) => ({
        // Subtle entrance used by routed page content. Gated behind
        // prefers-reduced-motion at the call site so motion-sensitive
        // users get an instant swap.
        "@keyframes pageEnter": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" }
        },
        html: {
          overflowWrap: "anywhere",
          WebkitTextSizeAdjust: "100%",
          colorScheme: "light dark",
          // Theme the root element too so the overscroll/canvas area
          // behind the app matches the active scheme instead of white.
          backgroundColor: paletteVar(themeParam).background.default
        },
        body: {
          color: paletteVar(themeParam).text.primary,
          backgroundColor: paletteVar(themeParam).background.default,
          fontFeatureSettings: '"cv11", "ss01"',
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          overflowWrap: "anywhere"
        }
      })
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 18px"
        },
        sizeSmall: { padding: "6px 14px", fontSize: "0.8125rem", minHeight: 36 },
        sizeLarge: { padding: "12px 22px", fontSize: "1rem" },
        contained: ({ theme: t }) => ({
          boxShadow: "none",
          "&:hover": {
            boxShadow: `0 4px 12px ${alphaToken(t, "primary.main", 0.25)}`
          }
        }),
        outlined: {
          borderWidth: 1
        }
      }
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 10, padding: 8 } }
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderColor: paletteVar(t).divider,
          backgroundColor: paletteVar(t).background.paper,
          backgroundImage: "none",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
        })
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 999,
          fontWeight: 600,
          fontSize: "0.75rem",
          height: 26,
          letterSpacing: "0.02em",
          backgroundColor: paletteVar(t).action.hover,
          color: paletteVar(t).text.primary
        }),
        sizeSmall: { height: 22, fontSize: "0.6875rem" }
      }
    },
    MuiTextField: {
      defaultProps: { size: "small" }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 10,
          backgroundColor: paletteVar(t).background.paper,
          "& fieldset": { borderColor: paletteVar(t).divider },
          "&:hover fieldset": { borderColor: paletteVar(t).action.active }
        })
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          textTransform: "none",
          borderColor: paletteVar(t).divider,
          color: paletteVar(t).text.primary,
          "&.Mui-selected": {
            backgroundColor: alphaToken(t, "primary.main", 0.08),
            color: paletteVar(t).primary.dark,
            borderColor: alphaToken(t, "primary.main", 0.4)
          },
          "&.Mui-selected:hover": {
            backgroundColor: alphaToken(t, "primary.main", 0.12)
          }
        })
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: "0.75rem",
          backgroundColor: "#1A1A1A"
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 3 }
      }
    }
  }
});
