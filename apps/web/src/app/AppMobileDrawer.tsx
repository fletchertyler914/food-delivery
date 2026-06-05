import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { Link } from "react-router";

import type { AuthUser } from "../lib/api/types";
import { CloseIcon } from "../lib/icons";
import { alphaToken } from "../theme/css-vars";
import { AppBrand } from "../components/AppBrand";
import { useRouteActive } from "./use-route-active";
import { paths } from "./paths";
import { ThemeToggle } from "./ThemeToggle";

export const APP_MOBILE_DRAWER_ID = "app-mobile-drawer";

interface AppMobileDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly user: AuthUser | null;
  readonly cartItemCount: number;
  readonly loginPath: string;
  readonly signupPath: string;
  readonly onSignOut: () => void;
}

export function AppMobileDrawer({
  open,
  onClose,
  user,
  cartItemCount,
  loginPath,
  signupPath,
  onSignOut
}: AppMobileDrawerProps): ReactElement {
  const isOwner = user?.role === "OWNER";

  return (
    <Drawer
      id={APP_MOBILE_DRAWER_ID}
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{ paper: { sx: { width: 300, maxWidth: "85vw" } } }}
    >
      <Stack height="100%">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          px={2}
          py={1.5}
          borderBottom={1}
          borderColor="divider"
        >
          <AppBrand />
          <IconButton aria-label="Close navigation menu" onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>

        <List component="nav" aria-label="Primary" sx={{ flexGrow: 1, py: 1 }} onClick={onClose}>
          <DrawerNavItem to={paths.restaurants}>Restaurants</DrawerNavItem>
          <DrawerNavItem to={paths.cart} badgeContent={cartItemCount}>
            Cart
          </DrawerNavItem>
          {user ? (
            <>
              <DrawerNavItem to={paths.orders}>Orders</DrawerNavItem>
              {isOwner ? <DrawerNavItem to={paths.dashboard}>Dashboard</DrawerNavItem> : null}
            </>
          ) : (
            <>
              <DrawerNavItem to={loginPath}>Sign in</DrawerNavItem>
              <DrawerNavItem to={signupPath}>Get started</DrawerNavItem>
            </>
          )}
        </List>

        <Divider />

        <Stack spacing={2} p={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Theme
            </Typography>
            <ThemeToggle />
          </Stack>
          {user ? (
            <>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="body2" color="text.primary" fontWeight={600}>
                  {user.name}
                </Typography>
                {isOwner ? <Chip label="Owner" size="small" color="primary" /> : null}
              </Stack>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button
              component={Link}
              to={signupPath}
              variant="contained"
              fullWidth
              onClick={onClose}
            >
              Get started
            </Button>
          )}
        </Stack>
      </Stack>
    </Drawer>
  );
}

interface DrawerNavItemProps {
  readonly to: string;
  readonly children: string;
  readonly badgeContent?: number;
}

function DrawerNavItem({ to, children, badgeContent }: DrawerNavItemProps): ReactElement {
  const isActive = useRouteActive(to);
  const primary =
    badgeContent !== undefined && badgeContent > 0 ? (
      <Badge badgeContent={badgeContent} color="primary" max={99}>
        {children}
      </Badge>
    ) : (
      children
    );

  return (
    <ListItemButton
      component={Link}
      to={to}
      aria-current={isActive ? "page" : undefined}
      sx={{
        mx: 1,
        borderRadius: 1.25,
        fontWeight: isActive ? 700 : 500,
        color: isActive ? "primary.main" : "text.primary",
        bgcolor: (t) => (isActive ? alphaToken(t, "primary.main", 0.08) : "transparent"),
        "&:hover": {
          bgcolor: (t) => alphaToken(t, "primary.main", isActive ? 0.12 : 0.06)
        }
      }}
    >
      <ListItemText primary={primary} slotProps={{ primary: { sx: { fontWeight: "inherit" } } }} />
    </ListItemButton>
  );
}
