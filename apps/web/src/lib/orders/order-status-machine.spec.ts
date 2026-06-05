import { describe, expect, it } from "vitest";

import {
  canTransition,
  formatStatusLabel,
  getAvailableTransitions,
  orderPerspectives,
  statusActionCopy
} from "./order-status-machine";

describe("order-status-machine", () => {
  it("allows owner fulfillment chain from PLACED", () => {
    expect(getAvailableTransitions("PLACED", new Set(["OWNER"])).map((t) => t.toStatus)).toEqual([
      "CANCELED",
      "PROCESSING"
    ]);
  });

  it("allows customer cancel and receive at the right times", () => {
    expect(canTransition("PLACED", "CANCELED", new Set(["CUSTOMER"])).allowed).toBe(true);
    expect(canTransition("DELIVERED", "RECEIVED", new Set(["CUSTOMER"])).allowed).toBe(true);
    expect(canTransition("PLACED", "PROCESSING", new Set(["CUSTOMER"])).allowed).toBe(false);
  });

  it("keeps owner and customer actions separated across the full matrix", () => {
    expect(
      getAvailableTransitions("PROCESSING", new Set(["OWNER"])).map((t) => t.toStatus)
    ).toEqual(["IN_ROUTE"]);
    expect(getAvailableTransitions("IN_ROUTE", new Set(["OWNER"])).map((t) => t.toStatus)).toEqual([
      "DELIVERED"
    ]);
    expect(getAvailableTransitions("DELIVERED", new Set(["OWNER"]))).toEqual([]);
    expect(getAvailableTransitions("PROCESSING", new Set(["CUSTOMER"]))).toEqual([]);
    expect(
      getAvailableTransitions("DELIVERED", new Set(["CUSTOMER"])).map((t) => t.toStatus)
    ).toEqual(["RECEIVED"]);
  });

  it("derives dual perspectives when the actor placed from their own restaurant", () => {
    const perspectives = orderPerspectives({
      customerId: "user-1",
      restaurantOwnerId: "user-1",
      actorId: "user-1"
    });
    expect(perspectives).toEqual(new Set(["CUSTOMER", "OWNER"]));
    expect(getAvailableTransitions("PLACED", perspectives).map((t) => t.toStatus)).toEqual([
      "CANCELED",
      "PROCESSING"
    ]);
    expect(canTransition("DELIVERED", "RECEIVED", perspectives).allowed).toBe(true);
  });

  it("formats statuses as friendly labels", () => {
    expect(formatStatusLabel("PLACED")).toBe("Placed");
    expect(formatStatusLabel("IN_ROUTE")).toBe("Out for delivery");
    expect(formatStatusLabel("PROCESSING")).toBe("Preparing");
    expect(formatStatusLabel("CANCELED")).toBe("Canceled");
  });

  it("exposes user-friendly action labels for every transition target", () => {
    expect(statusActionCopy("CANCELED").label).toBe("Cancel order");
    expect(statusActionCopy("PROCESSING").label).toBe("Start preparing");
    expect(statusActionCopy("IN_ROUTE").label).toBe("Send for delivery");
    expect(statusActionCopy("DELIVERED").label).toBe("Mark as delivered");
    expect(statusActionCopy("RECEIVED").label).toBe("Mark as received");
  });
});
