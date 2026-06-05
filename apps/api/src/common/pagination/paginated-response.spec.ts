import { describe, expect, it } from "vitest";

import { mapPaginated, paginateSlice, toPaginated } from "./paginated-response.dto";

interface Row {
  readonly id: string;
  readonly name: string;
}

const rows: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Bravo" },
  { id: "c", name: "Charlie" }
];

describe("paginateSlice", () => {
  it("returns all items with no cursor when the page is not over-fetched", () => {
    const result = paginateSlice(rows, 3);

    expect(result.data).toEqual(rows);
    expect(result.nextCursor).toBeUndefined();
  });

  it("drops the over-fetched row and uses the last kept id as the cursor", () => {
    const result = paginateSlice(rows, 2);

    expect(result.data).toEqual([rows[0], rows[1]]);
    expect(result.nextCursor).toBe("b");
  });

  it("returns an empty page with no cursor for no rows", () => {
    const result = paginateSlice<Row>([], 10);

    expect(result.data).toEqual([]);
    expect(result.nextCursor).toBeUndefined();
  });
});

describe("mapPaginated", () => {
  it("maps entities to DTOs while preserving the cursor", () => {
    const page = paginateSlice(rows, 2);

    const body = mapPaginated(page, (row) => row.name);

    expect(body).toEqual({ data: ["Alpha", "Bravo"], nextCursor: "b" });
  });

  it("omits nextCursor entirely when the page has no further results", () => {
    const page = paginateSlice(rows, 3);

    const body = mapPaginated(page, (row) => ({ label: row.name.toUpperCase() }));

    expect(body).toEqual({ data: [{ label: "ALPHA" }, { label: "BRAVO" }, { label: "CHARLIE" }] });
    expect("nextCursor" in body).toBe(false);
  });
});

describe("toPaginated", () => {
  it("maps an over-fetched slice and derives nextCursor from the last kept row", () => {
    const body = toPaginated(
      rows,
      2,
      (row) => row.name,
      (row) => row.id
    );

    expect(body).toEqual({ data: ["Alpha", "Bravo"], nextCursor: "b" });
  });

  it("returns only data when the result fits in one page", () => {
    const body = toPaginated(
      rows,
      3,
      (row) => row.id,
      (row) => row.id
    );

    expect(body).toEqual({ data: ["a", "b", "c"] });
    expect("nextCursor" in body).toBe(false);
  });
});
