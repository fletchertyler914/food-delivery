import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import Badge from "@mui/material/Badge";
import { Link, Outlet, useLocation, useNavigate, useNavigation } from "react-router";

import { useAuthStore } from "../features/auth/auth.store";
import { useCartStore } from "../features/cart/cart.store";
import { authPathWithFrom } from "../lib/auth/redirect-from";
import { signOut } from "../features/auth/sign-out";
import { MenuIcon } from "../lib/icons";
import { alphaToken } from "../theme/css-vars";
import { AccountMenu } from "./AccountMenu";
import { APP_MOBILE_DRAWER_ID, AppMobileDrawer } from "./AppMobileDrawer";
import { AppFooter } from "./AppFooter";
import { ThemeToggle } from "./ThemeToggle";
import { AppBrand } from "../components/AppBrand";
import { useRouteActive } from "./use-route-active";
import { paths } from "./paths";
import { queryClient } from "./query-client";

export function App(): ReactElement {
  const user = useAuthStore((state) => state.user);
  const cartItemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);
  const isInitialRender = useRef(true);

  // After every successful navigation (idle state), reset scroll to
  // the top and pull focus to the <main> landmark so screen readers
  // and keyboard users land on the new page's content. `preventScroll`
  // stops focus() from yanking the viewport when <main> happens to be
  // partially out of view (which is what was leaving pages scrolled
  // mid-way on mobile). The initial render is skipped so we don't
  // hijack the address bar on first paint.
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (navigation.state !== "idle") {
      return;
    }
    window.scrollTo({ top: 0, left: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [navigation.state, location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const loginPath = authPathWithFrom(paths.login, location.pathname, location.search);
  const signupPath = authPathWithFrom(paths.signup, location.pathname, location.search);

  const handleSignOut = (): void => {
    void (async () => {
      await signOut({ queryClient });
      await navigate(paths.restaurants);
    })();
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="background.default"
      color="text.primary"
      display="flex"
      flexDirection="column"
      sx={{ overflowX: "hidden" }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: (t) => alphaToken(t, "background.paper", 0.92),
          backdropFilter: "saturate(140%) blur(8px)"
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            py={{ xs: 1.25, md: 1.75 }}
            gap={2}
          >
            <AppBrand />

            {isMobile ? (
              <IconButton
                aria-label="Open navigation menu"
                aria-controls={APP_MOBILE_DRAWER_ID}
                aria-expanded={drawerOpen}
                onClick={() => {
                  setDrawerOpen(true);
                }}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Stack
                component="nav"
                aria-label="Primary"
                direction="row"
                gap={0.5}
                alignItems="center"
              >
                <Stack direction="row" gap={0.5} alignItems="center">
                  <NavButton to={paths.restaurants}>Restaurants</NavButton>
                  {user ? (
                    <>
                      <NavButton to={paths.orders}>Orders</NavButton>
                      {user.role === "OWNER" ? (
                        <NavButton to={paths.dashboard}>Dashboard</NavButton>
                      ) : null}
                    </>
                  ) : null}
                  <NavButton to={paths.cart} badgeContent={cartItemCount}>
                    Cart
                  </NavButton>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1.25 }} />

                <Stack direction="row" gap={0.5} alignItems="center">
                  <ThemeToggle />
                  {user ? (
                    <AccountMenu user={user} onSignOut={handleSignOut} />
                  ) : (
                    <>
                      <NavButton to={loginPath}>Sign in</NavButton>
                      <Button component={Link} to={signupPath} variant="contained" size="small">
                        Get started
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        </Container>
        <Box height={3}>
          {navigation.state === "loading" ? <LinearProgress color="primary" /> : null}
        </Box>
      </Box>

      <AppMobileDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        user={user}
        cartItemCount={cartItemCount}
        loginPath={loginPath}
        signupPath={signupPath}
        onSignOut={handleSignOut}
      />

      <Container
        component="main"
        ref={mainRef}
        maxWidth="lg"
        tabIndex={-1}
        sx={{ py: { xs: 4, md: 6 }, outline: "none", flexGrow: 1 }}
      >
        <Box
          key={location.pathname}
          sx={{
            "@media (prefers-reduced-motion: no-preference)": {
              animation: "pageEnter 260ms cubic-bezier(0.22, 1, 0.36, 1) both"
            }
          }}
        >
          <Outlet />
        </Box>
      </Container>
      <AppFooter />
    </Box>
  );
}

interface NavButtonProps {
  readonly to: string;
  readonly children: ReactNode;
  readonly badgeContent?: number;
}

// Route-aware nav link. The active route gets a tinted background
// instead of a solid contained variant so the header reads as a calm
// horizontal nav instead of a mash of buttons.
function NavButton({ to, children, badgeContent }: NavButtonProps): ReactElement {
  const isActive = useRouteActive(to);
  const label =
    badgeContent !== undefined && badgeContent > 0 ? (
      <Badge badgeContent={badgeContent} color="primary" max={99}>
        {children}
      </Badge>
    ) : (
      children
    );

  return (
    <Button
      component={Link}
      to={to}
      size="small"
      color="inherit"
      aria-current={isActive ? "page" : undefined}
      sx={{
        fontWeight: isActive ? 700 : 500,
        color: isActive ? "primary.main" : "text.secondary",
        bgcolor: (t) => (isActive ? alphaToken(t, "primary.main", 0.08) : "transparent"),
        "&:hover": {
          color: "primary.main",
          bgcolor: (t) => alphaToken(t, "primary.main", isActive ? 0.12 : 0.06)
        }
      }}
    >
      {label}
    </Button>
  );
}
