import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement, ReactNode } from "react";

import { LocalOfferIcon, LocalShippingIcon, RestaurantIcon } from "../../lib/icons";

export interface AuthShellProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

const HIGHLIGHTS = [
  { Icon: RestaurantIcon, label: "Curated kitchens" },
  { Icon: LocalShippingIcon, label: "Real-time tracking" },
  { Icon: LocalOfferIcon, label: "Discount codes" }
] as const;

// Two-column auth scaffold used by Login and Signup. The right panel
// is a brand surface — gradient + value props — and collapses on
// small viewports so mobile users land directly on the form.
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer
}: AuthShellProps): ReactElement {
  return (
    <Box maxWidth={960} mx="auto">
      <Card
        sx={{
          overflow: "hidden",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          borderRadius: { xs: 0, sm: 4 },
          border: { xs: "none", sm: 1 },
          borderColor: { xs: "transparent", sm: "divider" },
          // Card defaults to a slight elevation. On phones the form
          // reads as a native screen so we strip the shadow.
          boxShadow: { xs: "none", sm: 1 },
          minHeight: { md: 580 },
          backgroundColor: { xs: "transparent", sm: "background.paper" },
          "&:hover": { transform: "none" }
        }}
      >
        <Box
          sx={{
            flex: 1,
            // Tighter padding on phones — the surrounding Container
            // already gives 16px of breathing room.
            px: { xs: 0, sm: 5, md: 6 },
            py: { xs: 1, sm: 5, md: 6 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Stack
            spacing={{ xs: 2.5, sm: 3 }}
            maxWidth={420}
            mx={{ xs: "auto", md: 0 }}
            width="100%"
          >
            <Stack spacing={1}>
              <Typography variant="overline" color="primary.main">
                {eyebrow}
              </Typography>
              <Typography variant="h3" component="h1">
                {title}
              </Typography>
              {description ? (
                <Typography variant="body1" color="text.secondary">
                  {description}
                </Typography>
              ) : null}
            </Stack>

            {children}

            {footer ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ pt: 0.5, "& a": { color: "primary.main", fontWeight: 600 } }}
              >
                {footer}
              </Typography>
            ) : null}
          </Stack>
        </Box>

        <Box
          aria-hidden
          sx={{
            display: { xs: "none", md: "flex" },
            flex: 1,
            position: "relative",
            overflow: "hidden",
            color: "common.white",
            // Matches the landing hero: clean, saturated warm ramp with a
            // soft top-right glow instead of fading to a muddy near-black.
            background:
              "radial-gradient(115% 130% at 88% -15%, rgba(251, 146, 60, 0.5) 0%, transparent 55%), linear-gradient(135deg, #EA580C 0%, #C2410C 55%, #7C2D12 100%)",
            p: 6,
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              opacity: 0.6
            }}
          />
          <Stack spacing={3} sx={{ position: "relative" }}>
            <Typography variant="h4" sx={{ color: "common.white", lineHeight: 1.25 }}>
              Order tonight from
              <br />
              the kitchens{" "}
              <Box
                component="span"
                sx={{ color: (t) => t.palette.secondary.light, fontWeight: "inherit" }}
              >
                you love
              </Box>
              .
            </Typography>
            <Stack spacing={1.25}>
              {HIGHLIGHTS.map(({ Icon, label }) => (
                <Stack key={label} direction="row" alignItems="center" gap={1.25}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Icon sx={{ fontSize: 16, color: "common.white" }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.92 }}>
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Typography
            variant="caption"
            sx={{ opacity: 0.75, position: "absolute", left: 48, bottom: 48 }}
          >
            Independent kitchens · Fresh tonight
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
