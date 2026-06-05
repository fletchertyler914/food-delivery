import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";
import { Link as RouterLink, useLocation } from "react-router";

import { paths } from "./paths";
import { authPathWithFrom } from "../lib/auth/redirect-from";

export function AppFooter(): ReactElement {
  const year = new Date().getFullYear();
  const location = useLocation();
  const loginHref = authPathWithFrom(paths.login, location.pathname, location.search);
  const signupHref = authPathWithFrom(paths.signup, location.pathname, location.search);

  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        mt: 8
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          gap={{ xs: 4, md: 6 }}
        >
          <Stack spacing={1.5} maxWidth={360}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <Box
                aria-hidden
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.25,
                  background: (t) =>
                    `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.contrastText",
                  fontWeight: 800,
                  fontSize: "0.95rem"
                }}
              >
                FD
              </Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Food Delivery
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Restaurant-quality meals from independent kitchens, delivered to your door — with live
              order tracking from the kitchen pass.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            gap={{ xs: 4, sm: 6 }}
            flexWrap="wrap"
            sx={{ "& > *": { minWidth: 120 } }}
          >
            <FooterColumn
              title="Explore"
              links={[
                { label: "Browse restaurants", to: paths.restaurants },
                { label: "How it works", to: paths.home }
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                { label: "Sign in", to: loginHref },
                { label: "Get started", to: signupHref },
                { label: "Your orders", to: paths.orders }
              ]}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
        >
          <Typography variant="caption" color="text.secondary">
            © {year} Food Delivery. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Made with care for hungry humans.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

interface FooterColumnProps {
  readonly title: string;
  readonly links: readonly {
    readonly label: string;
    readonly to: string;
    readonly external?: boolean;
  }[];
}

function FooterColumn({ title, links }: FooterColumnProps): ReactElement {
  return (
    <Stack spacing={1.25}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Stack spacing={0.75}>
        {links.map((link) =>
          link.external ? (
            <Link
              key={link.to}
              href={link.to}
              underline="hover"
              color="text.primary"
              variant="body2"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ "&:hover": { color: "primary.main" } }}
            >
              {link.label}
            </Link>
          ) : (
            <Link
              key={link.to}
              component={RouterLink}
              to={link.to}
              underline="hover"
              color="text.primary"
              variant="body2"
              sx={{ "&:hover": { color: "primary.main" } }}
            >
              {link.label}
            </Link>
          )
        )}
      </Stack>
    </Stack>
  );
}
