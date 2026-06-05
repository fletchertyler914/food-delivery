import { describe, expect, it } from "vitest";

import { canTransition, type OrderStatus, type UserRole } from "./order-status-machine";

type Matrix = readonly (readonly [
  OrderStatus,
  OrderStatus,
  ReadonlySet<UserRole>,
  "allow" | "deny"
])[];

const STATUSES: readonly OrderStatus[] = [
  "PLACED",
  "CANCELED",
  "PROCESSING",
  "IN_ROUTE",
  "DELIVERED",
  "RECEIVED"
];

const CUSTOMER_ONLY = new Set<UserRole>(["CUSTOMER"]);
const OWNER_ONLY = new Set<UserRole>(["OWNER"]);
const BOTH = new Set<UserRole>(["CUSTOMER", "OWNER"]);

const ALLOWED: ReadonlySet<string> = new Set<string>([
  "PLACED->CANCELED:CUSTOMER",
  "PLACED->CANCELED:OWNER",
  "PLACED->CANCELED:BOTH",
  "PLACED->PROCESSING:OWNER",
  "PLACED->PROCESSING:BOTH",
  "PROCESSING->IN_ROUTE:OWNER",
  "PROCESSING->IN_ROUTE:BOTH",
  "IN_ROUTE->DELIVERED:OWNER",
  "IN_ROUTE->DELIVERED:BOTH",
  "DELIVERED->RECEIVED:CUSTOMER",
  "DELIVERED->RECEIVED:BOTH"
]);

function perspectiveKey(perspectives: ReadonlySet<UserRole>): string {
  if (perspectives.has("CUSTOMER") && perspectives.has("OWNER")) {
    return "BOTH";
  }
  if (perspectives.has("OWNER")) {
    return "OWNER";
  }
  return "CUSTOMER";
}

const MATRIX: Matrix = STATUSES.flatMap((from) =>
  STATUSES.flatMap((to) =>
    ([CUSTOMER_ONLY, OWNER_ONLY, BOTH] as const).map((perspectives) => {
      const key = `${from}->${to}:${perspectiveKey(perspectives)}`;
      const expected = ALLOWED.has(key) ? "allow" : "deny";
      return [from, to, perspectives, expected] as const;
    })
  )
);

describe("canTransition matrix (6 statuses x 6 statuses x perspectives)", () => {
  it.each(MATRIX)("%s -> %s with %j is %s", (from, to, perspectives, expected) => {
    const decision = canTransition(from, to, perspectives);
    if (expected === "allow") {
      expect(decision).toEqual({ allowed: true });
    } else {
      expect(decision.allowed).toBe(false);
    }
  });

  it("rejects identity transitions for every status and perspective", () => {
    for (const status of STATUSES) {
      for (const perspectives of [CUSTOMER_ONLY, OWNER_ONLY, BOTH] as const) {
        const decision = canTransition(status, status, perspectives);
        expect(decision).toEqual({
          allowed: false,
          reason: "Order is already in the requested status."
        });
      }
    }
  });

  it("treats CANCELED and RECEIVED as terminal for every outgoing transition", () => {
    for (const terminal of ["CANCELED", "RECEIVED"] as const) {
      for (const to of STATUSES) {
        if (to === terminal) {
          continue;
        }
        for (const perspectives of [CUSTOMER_ONLY, OWNER_ONLY, BOTH] as const) {
          const decision = canTransition(terminal, to, perspectives);
          expect(decision.allowed).toBe(false);
        }
      }
    }
  });

  it("only customer perspective can mark DELIVERED -> RECEIVED", () => {
    expect(canTransition("DELIVERED", "RECEIVED", CUSTOMER_ONLY)).toEqual({ allowed: true });
    expect(canTransition("DELIVERED", "RECEIVED", OWNER_ONLY).allowed).toBe(false);
    expect(canTransition("DELIVERED", "RECEIVED", BOTH)).toEqual({ allowed: true });
  });

  it("owners cannot skip the fulfillment chain", () => {
    expect(canTransition("PLACED", "IN_ROUTE", OWNER_ONLY).allowed).toBe(false);
    expect(canTransition("PLACED", "DELIVERED", OWNER_ONLY).allowed).toBe(false);
    expect(canTransition("PROCESSING", "DELIVERED", OWNER_ONLY).allowed).toBe(false);
  });

  it("customer-only perspective cannot drive fulfillment statuses", () => {
    expect(canTransition("PLACED", "PROCESSING", CUSTOMER_ONLY).allowed).toBe(false);
    expect(canTransition("PROCESSING", "IN_ROUTE", CUSTOMER_ONLY).allowed).toBe(false);
    expect(canTransition("IN_ROUTE", "DELIVERED", CUSTOMER_ONLY).allowed).toBe(false);
  });

  it("cancel is only available while the order is still PLACED", () => {
    expect(canTransition("PLACED", "CANCELED", CUSTOMER_ONLY)).toEqual({ allowed: true });
    expect(canTransition("PLACED", "CANCELED", OWNER_ONLY)).toEqual({ allowed: true });
    expect(canTransition("PROCESSING", "CANCELED", OWNER_ONLY).allowed).toBe(false);
    expect(canTransition("IN_ROUTE", "CANCELED", OWNER_ONLY).allowed).toBe(false);
    expect(canTransition("DELIVERED", "CANCELED", OWNER_ONLY).allowed).toBe(false);
  });

  it("dual perspective (owner ordering from own restaurant) can fulfill and receive", () => {
    expect(canTransition("PLACED", "PROCESSING", BOTH)).toEqual({ allowed: true });
    expect(canTransition("PROCESSING", "IN_ROUTE", BOTH)).toEqual({ allowed: true });
    expect(canTransition("IN_ROUTE", "DELIVERED", BOTH)).toEqual({ allowed: true });
    expect(canTransition("DELIVERED", "RECEIVED", BOTH)).toEqual({ allowed: true });
  });
});
