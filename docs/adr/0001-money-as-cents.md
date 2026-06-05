# 1. Money as integer cents

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Tyler Fletcher
- **Tags:** domain, money, persistence

## Context and Problem Statement

We need a single, unambiguous representation of money that survives JSON
serialization, database storage, JavaScript arithmetic, and percentage-based
coupon math. Floating-point currency is a known source of off-by-a-penny bugs
and is especially fragile in JavaScript, where `0.1 + 0.2 !== 0.3`. We also
want every layer — domain, API, web — to share the same contract so that no
boundary needs ad-hoc rounding logic.

## Decision Drivers

- Cross-language consistency: integers round-trip cleanly through HTTP, Prisma,
  and TypeScript without precision loss.
- Deterministic discount math, including rounding direction.
- Minimum dependencies: avoid pulling in `Decimal`, BigInt, or a money library.
- The deliverable is single-currency (USD) and does not need ISO-4217 metadata
  attached to every amount.

## Considered Options

1. **Integer cents represented as `number` with a branded type `Cents`.**
2. `string`-encoded decimal (e.g. `"12.50"`) parsed at the boundary.
3. `Decimal` from a money library (`dinero.js`, `bignumber.js`) on every layer.
4. Floats throughout, rounded for display.

## Decision Outcome

Chosen option **1: integer cents with a branded `Cents` type**.

```ts
export type Cents = number & { readonly __brand: "Cents" };
```

Constructors and arithmetic live in `apps/api/src/modules/orders/domain/pricing.ts`
(`cents`, `discountCents`, `computePricing`). Helpers throw typed
`DomainError` subclasses (`InvalidCentsError`, `InvalidDiscountPercentError`,
`EmptyOrderError`, `InvalidQuantityError`) so the global problem+json filter
renders a stable `code: "INVALID_PRICING_INPUT"`. Discounts round with
`Math.floor`, never toward the customer.

The web bundle mirrors the contract in `apps/web/src/lib/money/`, parses
inputs from cents-as-string via `formatCents`, and never calls `parseFloat`
on a currency field.

## Consequences

### Positive

- No accidental loss of precision: `subtotal + tip - discount` is closed under
  integers.
- Prisma columns are `Int`, so DB-level checks (`CHECK (totalCents >= 0)` etc.
  can be added without a type change).
- The branded type makes it a compile error to pass a raw `number` where money
  is expected.

### Negative / Trade-offs

- The display layer always has to divide by 100 with explicit formatting.
- Multi-currency support would require revisiting (cents-per-currency, FX).
  See "Out of Scope" in the README — this is intentional.

## Validation

- `apps/api/src/modules/orders/domain/pricing.spec.ts` — unit tests for the
  pricing helpers, including discount rounding direction.
- `apps/web/src/features/cart/cart.store.spec.ts` — proves the cart treats
  tips as integer cents.
- ESLint and TypeScript prevent untyped currency `number`s from leaking
  through the domain layer.
