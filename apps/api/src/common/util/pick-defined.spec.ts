import { describe, expect, it } from "vitest";

import { pickDefined } from "./pick-defined";

describe("pickDefined", () => {
  it("removes only undefined keys, keeping null and falsy values", () => {
    const result = pickDefined({
      a: "value",
      b: undefined,
      c: 0,
      d: false,
      e: null,
      f: ""
    });

    expect(result).toEqual({ a: "value", c: 0, d: false, e: null, f: "" });
    expect("b" in result).toBe(false);
  });

  it("returns an empty object when all keys are undefined", () => {
    expect(pickDefined({ a: undefined, b: undefined })).toEqual({});
  });
});
