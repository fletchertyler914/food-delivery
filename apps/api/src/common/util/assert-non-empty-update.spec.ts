import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { assertNonEmptyUpdate } from "./assert-non-empty-update";

describe("assertNonEmptyUpdate", () => {
  it("passes when at least one field is present", () => {
    expect(() => {
      assertNonEmptyUpdate({ name: "New name" });
    }).not.toThrow();
  });

  it("passes when a present field carries a falsy value", () => {
    expect(() => {
      assertNonEmptyUpdate({ active: false });
    }).not.toThrow();
  });

  it("throws BadRequestException when the update body has no keys", () => {
    expect(() => {
      assertNonEmptyUpdate({});
    }).toThrow(BadRequestException);
  });
});
