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

const ALL_TARGET_STATUSES: readonly OrderStatus[] = [
  "CANCELED",
  "PROCESSING",
  "IN_ROUTE",
  "DELIVERED",
  "RECEIVED"
];

export function orderPerspectives(input: {
  readonly customerId: string;
  readonly restaurantOwnerId: string;
  readonly actorId: string;
}): Set<UserRole> {
  const perspectives = new Set<UserRole>();
  if (input.customerId === input.actorId) {
    perspectives.add("CUSTOMER");
  }
  if (input.restaurantOwnerId === input.actorId) {
    perspectives.add("OWNER");
  }
  return perspectives;
}

export function canTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  perspectives: ReadonlySet<UserRole>
): StatusTransitionDecision {
  if (fromStatus === toStatus) {
    return { allowed: false, reason: "Order is already in the requested status." };
  }

  if (fromStatus === "CANCELED" || fromStatus === "RECEIVED") {
    return {
      allowed: false,
      reason: `${formatStatusLabel(fromStatus)} is a terminal status.`
    };
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
        reason: `Cannot move from ${formatStatusLabel(fromStatus)} to ${formatStatusLabel(toStatus)}.`
      };
}

export function getAvailableTransitions(
  fromStatus: OrderStatus,
  perspectives: ReadonlySet<UserRole>
): readonly { readonly toStatus: OrderStatus; readonly reason?: string }[] {
  return ALL_TARGET_STATUSES.flatMap((toStatus) => {
    const decision = canTransition(fromStatus, toStatus, perspectives);
    return decision.allowed ? [{ toStatus }] : [];
  });
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: "Placed",
  PROCESSING: "Preparing",
  IN_ROUTE: "Out for delivery",
  DELIVERED: "Delivered",
  RECEIVED: "Received",
  CANCELED: "Canceled"
};

export function formatStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status];
}

export function formatActorRole(role: UserRole): string {
  return role === "OWNER" ? "Restaurant" : "Customer";
}

export interface StatusActionCopy {
  readonly label: string;
  readonly description: string;
}

// Friendly verbs for the action buttons. Customers and owners both
// transition through the same statuses, so the copy is keyed on the
// destination status alone. The description is shown as a button
// tooltip when the transition is allowed — it should describe the
// consequence, not restate the button label.
export function statusActionCopy(toStatus: OrderStatus): StatusActionCopy {
  switch (toStatus) {
    case "CANCELED":
      return {
        label: "Cancel order",
        description: "Stops the restaurant from preparing it."
      };
    case "PROCESSING":
      return {
        label: "Start preparing",
        description: "Accept this order and start preparing it."
      };
    case "IN_ROUTE":
      return {
        label: "Send for delivery",
        description: "Mark this order as out for delivery."
      };
    case "DELIVERED":
      return {
        label: "Mark as delivered",
        description: "Confirm the order was delivered to the customer."
      };
    case "RECEIVED":
      return {
        label: "Mark as received",
        description: "Confirm you've received this order."
      };
    case "PLACED":
      return {
        label: "Place order",
        description: "Submit this order to the restaurant."
      };
  }
}

export type StatusChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

export function statusChipColor(status: OrderStatus): StatusChipColor {
  switch (status) {
    case "PLACED":
      return "info";
    case "PROCESSING":
      return "warning";
    case "IN_ROUTE":
      return "info";
    case "DELIVERED":
    case "RECEIVED":
      return "success";
    case "CANCELED":
      return "error";
  }
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
