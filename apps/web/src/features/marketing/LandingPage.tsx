import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import type { ComponentType, ReactElement } from "react";
import { Link } from "react-router";

import { paths } from "../../app/paths";
import { CoverImage } from "../../components/CoverImage";
import { ErrorPanel } from "../../components/ErrorPanel";
import { SectionHeader } from "../../components/SectionHeader";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import {
  AddShoppingCartIcon,
  LocalShippingIcon,
  RestaurantIcon,
  StorefrontIcon
} from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { restaurantsQuery } from "../restaurants/queries";

interface HowItWorksStep {
  readonly icon: ComponentType<SvgIconProps>;
  readonly title: string;
  readonly description: string;
}

const HOW_IT_WORKS: readonly HowItWorksStep[] = [
  {
    icon: RestaurantIcon,
    title: "Pick a kitchen",
    description: "Browse independent restaurants with seasonal menus and chef-driven dishes."
  },
  {
    icon: AddShoppingCartIcon,
    title: "Build your order",
    description: "Add meals, stack restaurant-issued coupons, and tip your driver at checkout."
  },
  {
    icon: LocalShippingIcon,
    title: "Track to your door",
    description: "Watch each status change land in real time — placed, prepping, out for delivery."
  }
] as const;

export function LandingPage(): ReactElement {
  const restaurants = useQuery(restaurantsQuery());
  const featured = (restaurants.data ?? []).slice(0, 3);
  const totalCount = restaurants.data?.length ?? 0;

  useDocumentTitle("Home");

  return (
    <Stack spacing={{ xs: 6, md: 10 }}>
      <Hero totalCount={totalCount} />
      <HowItWorksSection />
      <FeaturedKitchensSection
        isLoading={restaurants.isLoading}
        isError={restaurants.isError}
        error={restaurants.error}
        onRetry={() => {
          void restaurants.refetch();
        }}
        featured={featured}
        hasAny={totalCount > 0}
      />
      <TwoPathsSection />
    </Stack>
  );
}

interface HeroProps {
  readonly totalCount: number;
}

function Hero({ totalCount }: HeroProps): ReactElement {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        // Edge-to-edge on phones, rounded card from md up. The negative
        // margins cancel the page Container's gutter on xs/sm so the
        // hero feels like a banner, not a card with whitespace beside it.
        mx: { xs: -2, sm: -3, md: 0 },
        borderRadius: { xs: 0, md: 4 },
        px: { xs: 3, sm: 5, md: 8 },
        py: { xs: 6, sm: 8, md: 12 },
        color: "common.white",
        // Clean, saturated warm ramp instead of fading to a muddy
        // near-black. A soft top-right glow adds depth without the mud;
        // fixed hexes keep the banner identical in light and dark mode.
        background:
          "radial-gradient(115% 130% at 88% -15%, rgba(251, 146, 60, 0.5) 0%, transparent 55%), linear-gradient(135deg, #EA580C 0%, #C2410C 55%, #7C2D12 100%)"
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          opacity: 0.5,
          pointerEvents: "none"
        }}
      />
      <Stack spacing={{ xs: 2.5, md: 3 }} maxWidth={680} sx={{ position: "relative" }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            display: "inline-flex",
            alignSelf: "flex-start",
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.12)",
            border: 1,
            borderColor: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(4px)"
          }}
        >
          <Box
            aria-hidden
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: (t) => t.palette.secondary.light,
              boxShadow: (t) => `0 0 0 4px ${alpha(t.palette.secondary.light, 0.3)}`
            }}
          />
          <Typography
            variant="caption"
            sx={{ color: "common.white", fontWeight: 600, letterSpacing: "0.03em" }}
          >
            Open now in your neighborhood
          </Typography>
        </Stack>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            color: "common.white",
            fontWeight: 800,
            fontSize: { xs: "2rem", sm: "2.625rem", md: "3.5rem" },
            lineHeight: { xs: 1.1, md: 1.05 },
            letterSpacing: "-0.025em"
          }}
        >
          Restaurant-quality meals,{" "}
          <Box
            component="span"
            sx={{
              color: (t) => t.palette.secondary.light
            }}
          >
            delivered in minutes.
          </Box>
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "0.9375rem", md: "1.125rem" },
            opacity: 0.88,
            maxWidth: 560,
            lineHeight: 1.6
          }}
        >
          Order from independent kitchens, watch your meal move from the pass to your door in real
          time, and save with restaurant-issued coupons at checkout.
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          pt={{ xs: 1, md: 2 }}
          sx={{ "& .MuiButton-root": { minHeight: 48 } }}
        >
          <Button
            component={Link}
            to={paths.restaurants}
            variant="contained"
            size="large"
            sx={{
              bgcolor: "common.white",
              color: "primary.dark",
              fontWeight: 700,
              "&:hover": { bgcolor: "grey.100" }
            }}
          >
            Browse restaurants
          </Button>
          <Button
            component={Link}
            to={`${paths.signup}?role=OWNER`}
            variant="outlined"
            size="large"
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.4)",
              fontWeight: 600,
              "&:hover": {
                borderColor: "common.white",
                bgcolor: "rgba(255,255,255,0.08)"
              }
            }}
          >
            Open your kitchen →
          </Button>
        </Stack>
        {totalCount > 0 ? (
          <Stack
            direction="row"
            divider={
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.2)" }}
              />
            }
            gap={{ xs: 1.5, sm: 3 }}
            pt={{ xs: 2, md: 3 }}
            flexWrap="nowrap"
          >
            <Stat label="Curated kitchens" value={String(totalCount)} />
            <Stat label="Free pickup tonight" value="Available" />
            <Stat label="Avg. delivery" value="30 min" />
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

function HowItWorksSection(): ReactElement {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <SectionHeader title="How it works" description="Three steps to dinner." />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {HOW_IT_WORKS.map((step, index) => {
          const accent = index === 1 ? ("secondary" as const) : ("primary" as const);
          return (
            <Grid key={step.title} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  p: { xs: 2.5, md: 3 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  position: "relative",
                  overflow: "hidden",
                  transition: (t) =>
                    t.transitions.create(["transform", "box-shadow", "border-color"], {
                      duration: t.transitions.duration.short
                    }),
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 4,
                    borderColor: (t) => alpha(t.palette[accent].main, 0.3)
                  }
                }}
              >
                <Stack direction="row" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: (t) => alpha(t.palette[accent].main, 0.1),
                      color: `${accent}.main`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <step.icon />
                  </Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontFeatureSettings: '"tnum"' }}
                  >
                    Step {String(index + 1).padStart(2, "0")}
                  </Typography>
                </Stack>
                <Typography variant="h6" component="h3">
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                  {step.description}
                </Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

interface FeaturedKitchensSectionProps {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
  readonly featured: readonly {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly imageUrl: string | null;
  }[];
  readonly hasAny: boolean;
}

function FeaturedKitchensSection({
  isLoading,
  isError,
  error,
  onRetry,
  featured,
  hasAny
}: FeaturedKitchensSectionProps): ReactElement {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <SectionHeader
        title="Featured kitchens"
        description="Hand-picked kitchens serving tonight."
        action={
          <Button component={Link} to={paths.restaurants} variant="text">
            View all →
          </Button>
        }
      />

      {isLoading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      ) : isError ? (
        <ErrorPanel
          message={getErrorMessage(error, "Could not load restaurants.")}
          onRetry={onRetry}
        />
      ) : !hasAny ? (
        <Typography color="text.secondary">No restaurants are available yet.</Typography>
      ) : (
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {featured.map((restaurant) => (
            <Grid key={restaurant.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: "100%",
                  overflow: "hidden",
                  transition: (t) =>
                    t.transitions.create(["transform", "box-shadow", "border-color"], {
                      duration: t.transitions.duration.short
                    }),
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 6,
                    borderColor: (t) => alpha(t.palette.primary.main, 0.4)
                  }
                }}
              >
                <CardActionArea
                  component={Link}
                  to={paths.restaurant(restaurant.id)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch"
                  }}
                >
                  <Box sx={{ position: "relative" }}>
                    <CoverImage
                      src={restaurant.imageUrl}
                      seed={restaurant.name}
                      alt={restaurant.name}
                      ratio={16 / 10}
                      rounded={false}
                      overlay
                    />
                  </Box>
                  <Stack sx={{ p: { xs: 2, sm: 2.5 }, gap: 0.5, flexGrow: 1 }}>
                    <Typography variant="h6" component="h3">
                      {restaurant.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5
                      }}
                    >
                      {restaurant.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                        color: "primary.main",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em"
                      }}
                    >
                      Open menu →
                    </Typography>
                  </Stack>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}

function TwoPathsSection(): ReactElement {
  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <PathCard
          eyebrow="For diners"
          icon={AddShoppingCartIcon}
          title="Find your next favorite meal"
          description="Independent kitchens, transparent pricing, and real-time order tracking from pass to door."
          ctaLabel="Browse restaurants"
          ctaTo={paths.restaurants}
          accent="primary"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PathCard
          eyebrow="For restaurants"
          icon={StorefrontIcon}
          title="Run your kitchen, your way"
          description="Manage menus, issue coupons, and move every order through fulfillment from one dashboard."
          ctaLabel="Open your kitchen"
          ctaTo={`${paths.signup}?role=OWNER`}
          accent="secondary"
        />
      </Grid>
    </Grid>
  );
}

interface PathCardProps {
  readonly eyebrow: string;
  readonly icon: ComponentType<SvgIconProps>;
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly ctaTo: string;
  readonly accent: "primary" | "secondary";
}

function PathCard({
  eyebrow,
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaTo,
  accent
}: PathCardProps): ReactElement {
  return (
    <Card
      sx={{
        height: "100%",
        p: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
        overflow: "hidden",
        transition: (t) =>
          t.transitions.create(["transform", "box-shadow", "border-color"], {
            duration: t.transitions.duration.short
          }),
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: 4,
          borderColor: (t) => alpha(t.palette[accent].main, 0.4)
        }
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: (t) =>
            `radial-gradient(circle at 50% 50%, ${alpha(t.palette[accent].main, 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none"
        }}
      />
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette[accent].main, 0.12),
            color: `${accent}.main`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon />
        </Box>
        <Typography
          variant="overline"
          sx={{ color: `${accent}.main`, fontWeight: 700, letterSpacing: "0.08em" }}
        >
          {eyebrow}
        </Typography>
      </Stack>
      <Typography variant="h5" component="h3" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, lineHeight: 1.6 }}>
        {description}
      </Typography>
      <Box pt={1} sx={{ position: "relative" }}>
        <Button
          component={Link}
          to={ctaTo}
          variant="contained"
          color={accent}
          size="medium"
          sx={{ fontWeight: 700 }}
        >
          {ctaLabel} →
        </Button>
      </Box>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <Stack gap={0.25} sx={{ minWidth: 0 }}>
      <Typography
        variant="h6"
        sx={{
          color: "common.white",
          fontWeight: 700,
          fontSize: { xs: "1.0625rem", md: "1.25rem" },
          whiteSpace: "nowrap"
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: "rgba(255,255,255,0.78)", letterSpacing: "0.02em" }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
