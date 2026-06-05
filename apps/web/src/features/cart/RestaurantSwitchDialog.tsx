import type { ReactElement } from "react";

import { ConfirmDialog } from "../../components/ConfirmDialog";

interface RestaurantSwitchDialogProps {
  readonly open: boolean;
  readonly newRestaurantName: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

// Single-restaurant carts are a domain invariant (one restaurant per
// order). Surfacing the swap explicitly avoids the silent destructive
// behavior the previous store had, where adding from a second
// restaurant would wipe the cart without the user noticing.
export function RestaurantSwitchDialog({
  open,
  newRestaurantName,
  onConfirm,
  onCancel
}: RestaurantSwitchDialogProps): ReactElement {
  const subject =
    newRestaurantName.length > 0 ? (
      <>
        from <strong>{newRestaurantName}</strong>
      </>
    ) : (
      "this item"
    );

  return (
    <ConfirmDialog
      open={open}
      title="Replace your cart?"
      description={
        <>
          Each order has to come from a single restaurant. Adding {subject} will clear what&apos;s
          already in your cart.
        </>
      }
      confirmLabel="Replace cart"
      cancelLabel="Keep current cart"
      onConfirm={onConfirm}
      onClose={onCancel}
    />
  );
}
