import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { paths } from "../../app/paths";
import { CoverImage } from "../../components/CoverImage";
import { EmptyState } from "../../components/EmptyState";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PageHeader } from "../../components/PageHeader";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { RestaurantIcon, SearchIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { restaurantsQuery } from "./queries";

export function RestaurantsPage(): ReactElement {
  const restaurants = useQuery(restaurantsQuery());
  const [search, setSearch] = useState("");

  useDocumentTitle("Restaurants");

  const filtered = useMemo(() => {
    const data = restaurants.data ?? [];
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return data;
    }
    return data.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.description.toLowerCase().includes(query)
    );
  }, [restaurants.data, search]);

  if (restaurants.isLoading) {
    return (
      <Stack spacing={4}>
        <Skeleton variant="rounded" height={120} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((key) => (
            <Grid
              key={key}
              size={{
                xs: 12,
                sm: 6,
                md: 4
              }}
            >
              <Skeleton variant="rounded" height={320} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  if (restaurants.isError) {
    return (
      <ErrorPanel
        message={getErrorMessage(restaurants.error, "Could not load restaurants.")}
        onRetry={() => {
          void restaurants.refetch();
        }}
      />
    );
  }

  const total = restaurants.data?.length ?? 0;

  const searchField = (
    <TextField
      placeholder="Search by name or cuisine"
      value={search}
      onChange={(event) => {
        setSearch(event.target.value);
      }}
      fullWidth
      sx={{ width: { xs: "100%", sm: 320 } }}
      slotProps={{
        htmlInput: { "aria-label": "Search restaurants" },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }
      }}
    />
  );

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Browse"
        title="Restaurants"
        description={
          total === 0
            ? "No kitchens are live yet. Check back soon."
            : `${String(total)} kitchen${total === 1 ? "" : "s"} ready to take your order.`
        }
        actions={searchField}
      />
      {total === 0 ? (
        <EmptyState
          icon={<RestaurantIcon />}
          title="No restaurants yet"
          description="New kitchens will appear here as they come online."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchIcon />}
          title={`No matches for "${search}"`}
          description="Try a different search term, or clear the search to browse the full list."
        />
      ) : (
        <Grid container spacing={3}>
          {filtered.map((restaurant) => (
            <Grid
              key={restaurant.id}
              size={{
                xs: 12,
                sm: 6,
                md: 4
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 6,
                    borderColor: "transparent"
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
                  <CoverImage
                    src={restaurant.imageUrl}
                    seed={restaurant.name}
                    alt={restaurant.name}
                    ratio={5 / 3}
                    rounded={false}
                  />
                  <Box sx={{ p: 2.5, flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
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
                        minHeight: 40
                      }}
                    >
                      {restaurant.description}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
