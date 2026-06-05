import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactElement } from "react";

import type { AuthUser } from "../lib/api/types";
import { ExpandMoreIcon, LogoutIcon } from "../lib/icons";
import { alphaToken } from "../theme/css-vars";

interface AccountMenuProps {
  readonly user: AuthUser;
  readonly onSignOut: () => void;
}

// Single pill-shaped trigger (avatar + name + chevron) opens a Menu
// that owns the rest of the identity surface — email, role chip, and
// sign-out — so the header bar stays calm and the name never has to
// fight the Owner chip and Sign-out button for horizontal space.
export function AccountMenu({ user, onSignOut }: AccountMenuProps): ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = anchorEl !== null;
  const isOwner = user.role === "OWNER";
  const initials = getInitials(user.name);

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        size="small"
        color="inherit"
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "account-menu" : undefined}
        aria-label={`Account menu for ${user.name}`}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transition: (t) => t.transitions.create("transform"),
              transform: open ? "rotate(180deg)" : "rotate(0deg)"
            }}
          />
        }
        sx={{
          ml: 1,
          pl: 0.5,
          pr: 1,
          py: 0.25,
          borderRadius: 999,
          border: 1,
          borderColor: "divider",
          color: "text.primary",
          textTransform: "none",
          "&:hover": {
            borderColor: (t) => alphaToken(t, "primary.main", 0.4),
            bgcolor: (t) => alphaToken(t, "primary.main", 0.04)
          }
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.78rem",
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText"
            }}
          >
            {initials}
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            sx={{ maxWidth: 140, display: { xs: "none", lg: "block" } }}
          >
            {user.name}
          </Typography>
        </Stack>
      </Button>

      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: { mt: 1, minWidth: 260, borderRadius: 2, overflow: "hidden" }
          },
          list: { "aria-label": "Account" }
        }}
      >
        <Box px={2} py={1.5}>
          <Stack direction="row" gap={1.5} alignItems="center" minWidth={0}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontSize: "0.95rem",
                fontWeight: 700,
                bgcolor: "primary.main",
                color: "primary.contrastText"
              }}
            >
              {initials}
            </Avatar>
            <Stack minWidth={0} flexGrow={1}>
              <Stack direction="row" gap={1} alignItems="center" minWidth={0}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {user.name}
                </Typography>
                {isOwner ? (
                  <Chip
                    label="Owner"
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Stack>
          </Stack>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            handleClose();
            onSignOut();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (first === undefined) {
    return "?";
  }
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  if (last === undefined) {
    return first.slice(0, 2).toUpperCase();
  }
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
