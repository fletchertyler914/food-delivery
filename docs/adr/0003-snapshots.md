# 3. Order item snapshots

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Tyler Fletcher
- **Tags:** domain, orders, persistence, history

## Context and Problem Statement

Meals can change name and price, and they can be deactivated. Orders, by
contrast, are historical facts — a customer who placed an order at $9.50
should always see that they paid $9.50, even after the meal is renamed to
"Spicy Pad Thai" and re-priced to $11.00. The line items on the order also
need to render correctly when the meal row no longer exists in any usable
form (e.g. has been deactivated and edited).

We also need a "reorder" flow ("duplicate this order") whose semantics are
explicitly **today's** prices, not yesterday's.

## Decision Drivers

- Historical orders must be immutable. Display, receipts, and disputes must
  reproduce exactly what the customer agreed to at checkout.
- We do not want to copy the entire meal row, only the fields the customer
  actually saw.
- The "duplicate order" UX must clearly use current prices and explain
  dropped items, rather than silently resurrecting stale prices.

## Considered Options

1. **Snapshot `nameSnapshot` and `priceCentsSnapshot` on each `OrderItem`;
   rebuild from current meals on `duplicate`.**
2. Hard-delete protection on meals so the row never changes.
3. Versioned `Meal` rows (`Meal v1`, `Meal v2`) with an FK to a specific
   version.
4. Read prices from a join with `Meal` at display time.

## Decision Outcome

Chosen option **1: per-line-item snapshots**.

Prisma schema (`apps/api/prisma/schema.prisma`):

```prisma
model OrderItem {
  // ...
  nameSnapshot       String
  priceCentsSnapshot Int
  quantity           Int
  // FK to Meal kept with onDelete: Restrict so meals cannot be hard-deleted
  // while history still references them. Soft-deactivation is allowed.
}
```

- `OrdersService.place` writes both snapshot fields at order time, in the
  same transaction that creates the `Order` and `OrderStatusEvent`.
- Snapshots are never updated, anywhere.
- `OrdersService.duplicate` rebuilds the cart from **current** meal rows.
  Inactive or missing meals are dropped and surfaced as a warning in the
  response so the UI can tell the customer.

## Consequences

### Positive

- Historical orders are immutable and self-contained — no join to `Meal`
  needed to render an old receipt.
- Owners can edit/rename/deactivate meals freely without rewriting history.
- `duplicate` is intuitive: it gives the customer today's menu, not a
  time-traveling cart.

### Negative / Trade-offs

- A small amount of column duplication on `OrderItem`.
- Code reviewers must remember the rule "snapshots are write-once" — enforced
  by tests and by the absence of any `update` call on snapshot fields.

## Validation

- `apps/api/src/modules/orders/orders.service.integration.spec.ts` — verifies
  snapshots are written at `place` and remain stable when the meal mutates.
- `apps/api/test/orders.duplicate.e2e-spec.ts` — proves `duplicate` reads
  current meal prices and drops inactive meals with a warning.
- `apps/web/src/features/orders/OrderDetailPage.tsx` — renders snapshot
  fields and price totals from the order payload itself.
