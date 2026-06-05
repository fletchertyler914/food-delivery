import { afterEach, describe, expect, it, vi } from "vitest";

import { HealthService } from "./health.service";

describe("HealthService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("live returns ok status with timestamp", () => {
    const service = new HealthService({ $queryRaw: vi.fn() } as never);
    const result = service.live();
    expect(result.status).toBe("ok");
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("ready reports database up when query succeeds", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) };
    const service = new HealthService(prisma as never);

    await expect(service.ready()).resolves.toMatchObject({
      status: "ok",
      checks: { database: "up" }
    });
  });

  it("ready reports database down when query fails", async () => {
    const prisma = { $queryRaw: vi.fn().mockRejectedValue(new Error("connection refused")) };
    const service = new HealthService(prisma as never);

    await expect(service.ready()).resolves.toMatchObject({
      status: "error",
      checks: { database: "down" }
    });
  });
});
