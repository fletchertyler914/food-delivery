import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";

import { EmptyState } from "../../components/EmptyState";
import { ErrorPanel } from "../../components/ErrorPanel";
import { PageHeader } from "../../components/PageHeader";
import { SectionHeader } from "../../components/SectionHeader";
import { getErrorMessage } from "../../lib/errors/get-error-message";
import { PlusIcon, StorefrontIcon } from "../../lib/icons";
import { useDocumentTitle } from "../../lib/use-document-title";
import { BlocksPanel } from "./components/BlocksPanel";
import { NewRestaurantDialog, RestaurantRow } from "./components/RestaurantSections";
import { ownerRestaurantsQuery } from "./queries";

export function OwnerDashboardPage(): ReactElement {
  const [expandedRestaurantId, setExpandedRestaurantId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useDocumentTitle("Dashboard");

  const restaurants = useQuery(ownerRestaurantsQuery());

  if (restaurants.isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (restaurants.isError) {
    return (
      <ErrorPanel
        message={getErrorMessage(restaurants.error, "Could not load your restaurants.")}
        onRetry={() => {
          void restaurants.refetch();
        }}
      />
    );
  }

  const data = restaurants.data ?? [];

  return (
    <Stack spacing={4}>
      <PageHeader
        eyebrow="Owner"
        title="Dashboard"
        description="Manage your restaurants, meals, coupons, and blocked customers."
        actions={
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            New restaurant
          </Button>
        }
      />

      <Stack spacing={2}>
        <SectionHeader
          title="Your restaurants"
          description={
            data.length === 0
              ? "Create your first restaurant to start serving customers."
              : `${String(data.length)} restaurant${data.length === 1 ? "" : "s"} in your portfolio.`
          }
        />

        {data.length === 0 ? (
          <EmptyState
            icon={<StorefrontIcon />}
            title="No restaurants yet"
            description="Create a restaurant to add meals, coupons, and start receiving orders."
            action={
              <Button
                variant="contained"
                startIcon={<PlusIcon />}
                onClick={() => {
                  setCreateOpen(true);
                }}
              >
                New restaurant
              </Button>
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {data.map((restaurant) => (
              <RestaurantRow
                key={restaurant.id}
                restaurantId={restaurant.id}
                name={restaurant.name}
                description={restaurant.description}
                imageUrl={restaurant.imageUrl}
                expanded={expandedRestaurantId === restaurant.id}
                onToggle={() => {
                  setExpandedRestaurantId((current) =>
                    current === restaurant.id ? null : restaurant.id
                  );
                }}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <BlocksPanel />

      <NewRestaurantDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
        }}
      />
    </Stack>
  );
}
