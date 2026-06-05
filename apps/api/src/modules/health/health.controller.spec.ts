import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { HealthController } from "./health.controller";
import type { HealthService, ReadinessStatus, HealthStatus } from "./health.service";

function buildController(overrides: Partial<HealthService>): HealthController {
  return new HealthController(overrides as HealthService);
}

describe("HealthController", () => {
  it("returns the liveness payload from the service", () => {
    const live: HealthStatus = { status: "ok", timestamp: "2026-01-01T00:00:00.000Z" };
    const controller = buildController({ live: vi.fn().mockReturnValue(live) });

    expect(controller.live()).toEqual(live);
  });

  it("returns the readiness payload when the database is up", async () => {
    const ready: ReadinessStatus = {
      status: "ok",
      timestamp: "2026-01-01T00:00:00.000Z",
      checks: { database: "up" }
    };
    const controller = buildController({ ready: vi.fn().mockResolvedValue(ready) });

    await expect(controller.ready()).resolves.toEqual(ready);
  });

  it("throws a 503 ServiceUnavailableException when the database is down", async () => {
    const downStatus: ReadinessStatus = {
      status: "error",
      timestamp: "2026-01-01T00:00:00.000Z",
      checks: { database: "down" }
    };
    const controller = buildController({ ready: vi.fn().mockResolvedValue(downStatus) });

    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);

    try {
      await controller.ready();
      expect.unreachable("expected ServiceUnavailableException");
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
      expect((error as ServiceUnavailableException).getResponse()).toEqual(downStatus);
    }
  });
});
