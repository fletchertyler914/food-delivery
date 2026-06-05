import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import type { ReactElement } from "react";
import { useState } from "react";

import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { ErrorPanel } from "../../../components/ErrorPanel";
import { SectionHeader } from "../../../components/SectionHeader";
import { blockCustomer, unblockCustomer, type BlockCandidate } from "../../../lib/api/blocks.api";
import { getErrorMessage } from "../../../lib/errors/get-error-message";
import { ownerBlockCandidatesQuery, ownerBlocksQuery, ownerKeys } from "../queries";

export function BlocksPanel(): ReactElement {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedCandidate, setSelectedCandidate] = useState<BlockCandidate | null>(null);
  const [pendingBlock, setPendingBlock] = useState<BlockCandidate | null>(null);
  const [pendingUnblock, setPendingUnblock] = useState<{
    readonly customerId: string;
    readonly name: string;
  } | null>(null);

  const blocks = useQuery(ownerBlocksQuery());
  const candidates = useQuery(ownerBlockCandidatesQuery());

  const blockMutation = useMutation({
    mutationFn: (customer: BlockCandidate) => blockCustomer(customer.id),
    onSuccess: async (_data, customer) => {
      setSelectedCandidate(null);
      setPendingBlock(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ownerKeys.blocks() }),
        queryClient.invalidateQueries({ queryKey: ownerKeys.blockCandidates() })
      ]);
      enqueueSnackbar(`${customer.name} can no longer order from you.`, { variant: "warning" });
    }
  });

  const unblockMutation = useMutation({
    mutationFn: ({ customerId }: { readonly customerId: string; readonly name: string }) =>
      unblockCustomer(customerId),
    onSuccess: async (_data, variables) => {
      setPendingUnblock(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ownerKeys.blocks() }),
        queryClient.invalidateQueries({ queryKey: ownerKeys.blockCandidates() })
      ]);
      enqueueSnackbar(`${variables.name} can order again.`, { variant: "info" });
    }
  });

  const items = blocks.data ?? [];
  const candidateItems = candidates.data ?? [];

  return (
    <Card sx={{ p: { xs: 2.5, sm: 3 }, "&:hover": { transform: "none" } }}>
      <SectionHeader
        title="Blocked customers"
        description="Block customers who violate your terms. They will not be able to place new orders with your restaurants."
      />

      {blocks.isLoading ? (
        <BlockRowSkeletonList />
      ) : blocks.isError ? (
        <ErrorPanel
          message={getErrorMessage(blocks.error, "Could not load blocked customers.")}
          onRetry={() => {
            void blocks.refetch();
          }}
        />
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No blocked customers.
        </Typography>
      ) : (
        <Stack spacing={1} mb={3}>
          {items.map((block) => (
            <Stack
              key={block.id}
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              gap={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.50"
              }}
            >
              <Stack minWidth={0}>
                <Typography variant="body2" fontWeight={600}>
                  {block.customer.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {block.customer.email}
                </Typography>
              </Stack>
              <Button
                size="medium"
                color="inherit"
                sx={{ color: "text.secondary", width: { xs: "100%", sm: "auto" } }}
                disabled={unblockMutation.isPending}
                onClick={() => {
                  setPendingUnblock({ customerId: block.customerId, name: block.customer.name });
                }}
              >
                Unblock
              </Button>
            </Stack>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2 }} />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.5}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
      >
        <Autocomplete
          disablePortal
          options={candidateItems}
          loading={candidates.isLoading}
          value={selectedCandidate}
          onChange={(_event, value) => {
            setSelectedCandidate(value);
          }}
          getOptionLabel={(option) => `${option.name} (${option.email})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              label="Customer to block"
              helperText="Only customers who have ordered from your restaurants are listed."
              {...params}
            />
          )}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          disabled={blockMutation.isPending || selectedCandidate === null}
          onClick={() => {
            if (selectedCandidate !== null) {
              setPendingBlock(selectedCandidate);
            }
          }}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, mt: { sm: 0.25 } }}
        >
          Block customer
        </Button>
      </Stack>
      {blockMutation.isError ? (
        <Box sx={{ mt: 2 }}>
          <ErrorPanel message={getErrorMessage(blockMutation.error, "Could not block customer.")} />
        </Box>
      ) : null}

      <ConfirmDialog
        open={pendingBlock !== null}
        title={pendingBlock ? `Block ${pendingBlock.name}?` : "Block customer?"}
        description="They won't be able to place new orders with your restaurants. Existing orders are unaffected."
        confirmLabel="Block"
        confirmColor="error"
        loading={blockMutation.isPending}
        onClose={() => {
          if (!blockMutation.isPending) {
            setPendingBlock(null);
          }
        }}
        onConfirm={() => {
          if (pendingBlock !== null) {
            blockMutation.mutate(pendingBlock);
          }
        }}
      />

      <ConfirmDialog
        open={pendingUnblock !== null}
        title={pendingUnblock ? `Unblock ${pendingUnblock.name}?` : "Unblock customer?"}
        description="They'll be able to place new orders with your restaurants again."
        confirmLabel="Unblock"
        loading={unblockMutation.isPending}
        onClose={() => {
          if (!unblockMutation.isPending) {
            setPendingUnblock(null);
          }
        }}
        onConfirm={() => {
          if (pendingUnblock !== null) {
            unblockMutation.mutate(pendingUnblock);
          }
        }}
      />
    </Card>
  );
}

export function BlockRowSkeletonList(): ReactElement {
  return (
    <Stack spacing={1} mb={3}>
      {[0, 1, 2].map((index) => (
        <Stack
          key={index}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.50" }}
        >
          <Stack flex={1} gap={0.5}>
            <Skeleton variant="rounded" width="40%" height={18} />
            <Skeleton variant="rounded" width="55%" height={14} />
          </Stack>
          <Skeleton variant="rounded" width={88} height={36} />
        </Stack>
      ))}
    </Stack>
  );
}
