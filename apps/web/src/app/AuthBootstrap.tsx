import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import { type PropsWithChildren, type ReactElement, useEffect, useState } from "react";

import { useAuthStore } from "../features/auth/auth.store";
import { bootstrapAuth } from "./auth-bootstrap";

const pulse = keyframes`
  0%   { opacity: 0.35; transform: scale(0.92); }
  50%  { opacity: 1;    transform: scale(1.05); }
  100% { opacity: 0.35; transform: scale(0.92); }
`;

// Branded loader matching the design system. Avoids the bare MUI
// CircularProgress that landed during the first paint when restoring
// a persisted session.
function Loader(): ReactElement {
  return (
    <Stack alignItems="center" gap={2}>
      <Box
        aria-hidden
        sx={(t) => ({
          width: 40,
          height: 40,
          borderRadius: 1.25,
          bgcolor: "primary.main",
          color: "common.white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: "1rem",
          boxShadow: t.shadows[6],
          animation: `${pulse} 1.4s ease-in-out infinite`
        })}
      >
        FD
      </Box>
      <Typography variant="caption" color="text.secondary" aria-label="Restoring session">
        Restoring your session…
      </Typography>
    </Stack>
  );
}

// Kicks off the single shared session-restore on first mount. We only
// block the shell with a spinner when there is a persisted user worth
// recovering — for cold loads of an unauthenticated visitor the
// public shell paints immediately, and the header reactively flips to
// the logged-in nav if the silent refresh ends up succeeding.
export function AuthBootstrap({ children }: PropsWithChildren): ReactElement {
  const persistedUser = useAuthStore((state) => state.user);
  const [ready, setReady] = useState(() => persistedUser === null);

  useEffect(() => {
    let cancelled = false;
    void bootstrapAuth().finally(() => {
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="100vh">
        <Loader />
      </Stack>
    );
  }

  return <>{children}</>;
}
