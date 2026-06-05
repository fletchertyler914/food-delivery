# 2. Order status state machine

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Tyler Fletcher
- **Tags:** domain, orders, state-machine, audit

## Context and Problem Statement

An order moves through a small but strict set of states (`PLACED`,
`PROCESSING`, `IN_ROUTE`, `DELIVERED`, `RECEIVED`, `CANCELED`). The brief
requires:

- Customers and owners can each only act on specific transitions.
- Orders never move backward.
- Cancellation is only allowed before processing has started.
- Every transition must be auditable.

Allowing controllers or services to write `Order.status` directly would let
any of these invariants drift over time — especially as new endpoints are
added.

## Decision Drivers

- Single source of truth for legal transitions.
- Discriminated result type so callers cannot silently ignore an
  illegal-transition check.
- An immutable audit log for every status change, in the same DB transaction
  as the update.
- Compile-time exhaustiveness so adding a new status forces a review of every
  transition table.

## Considered Options

1. **Centralized `OrderStatusMachine.canTransition` with a discriminated
   `Result` and `OrderStatusEvent` append-only log.**
2. Inline status checks in `OrdersService` methods.
3. Database-level triggers enforcing legal transitions.
4. Workflow library (XState, etc.) wrapping the orders aggregate.

## Decision Outcome

Chosen option **1: centralized `OrderStatusMachine`**.

```ts
PLACED ──► PROCESSING ──► IN_ROUTE ──► DELIVERED ──► RECEIVED
  │
  └──► CANCELED
```

- `PLACED` is the only initial state.
- `CANCELED` is only reachable from `PLACED`, by customer or owner.
- `PROCESSING → IN_ROUTE → DELIVERED` is owner-only.
- `RECEIVED` is customer-only and only from `DELIVERED`.
- `canTransition` returns a discriminated `{ ok: true } | { ok: false; error }`
  so the type system forbids ignoring the result.
- Every status write goes through `OrdersService.transition`, which writes an
  `OrderStatusEvent(fromStatus, toStatus, actorId, actorRole)` in the same
  `prisma.$transaction` as the `Order.status` update.

## Consequences

### Positive

- No service or controller can introduce a back-transition without changing
  the machine.
- The append-only `OrderStatusEvent` table is the audit trail and powers the
  status timeline UI without an extra log system.
- `Result` typing means consumers must handle both branches.

### Negative / Trade-offs

- Adding a status requires touching one file (`order-status-machine.ts`) and
  re-running the role matrix tests; that is the intended cost.
- The state machine is in-process; a distributed system would want events on a
  bus. Acceptable here — see ADR 0006 for stack scope.

## Validation

- `apps/api/src/modules/orders/domain/order-status-machine.spec.ts` — full
  transition matrix covered.
- `apps/api/src/modules/orders/orders.service.integration.spec.ts` — proves
  the transition and the event row are written in one transaction.
- `apps/web/src/features/orders/order-status.spec.tsx` — role-aware UI
  matrix mirrors the same allowed transitions.
