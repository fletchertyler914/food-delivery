export type OrderStatus =
  | "PLACED"
  | "CANCELED"
  | "PROCESSING"
  | "IN_ROUTE"
  | "DELIVERED"
  | "RECEIVED";

export type UserRole = "CUSTOMER" | "OWNER";

export type StatusTransitionDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

// Perspectives are derived from the actor's relationship to the order
// (customer-of, owner-of), not from JWT role alone. An owner who placed
// an order from their own restaurant holds both perspectives.
export function canTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  perspectives: ReadonlySet<UserRole>
): StatusTransitionDecision {
  if (fromStatus === toStatus) {
    return { allowed: false, reason: "Order is already in the requested status." };
  }

  if (fromStatus === "CANCELED" || fromStatus === "RECEIVED") {
    return { allowed: false, reason: `${fromStatus} is a terminal status.` };
  }

  if (toStatus === "CANCELED") {
    return fromStatus === "PLACED"
      ? { allowed: true }
      : { allowed: false, reason: "Orders can only be canceled while placed." };
  }

  if (toStatus === "RECEIVED") {
    return fromStatus === "DELIVERED" && perspectives.has("CUSTOMER")
      ? { allowed: true }
      : { allowed: false, reason: "Only customers can mark delivered orders as received." };
  }

  if (!perspectives.has("OWNER")) {
    return {
      allowed: false,
      reason: "Only restaurant owners can move orders through fulfillment statuses."
    };
  }

  const expectedNextStatus = getOwnerNextStatus(fromStatus);

  return expectedNextStatus === toStatus
    ? { allowed: true }
    : {
        allowed: false,
        reason: `Cannot transition from ${fromStatus} to ${toStatus}.`
      };
}

function getOwnerNextStatus(status: OrderStatus): OrderStatus | undefined {
  switch (status) {
    case "PLACED":
      return "PROCESSING";
    case "PROCESSING":
      return "IN_ROUTE";
    case "IN_ROUTE":
      return "DELIVERED";
    case "CANCELED":
    case "DELIVERED":
    case "RECEIVED":
      return undefined;
  }
}
