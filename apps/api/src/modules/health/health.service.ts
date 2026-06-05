import { Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

export interface HealthStatus {
  readonly status: "ok" | "error";
  readonly timestamp: string;
}

export interface ReadinessStatus extends HealthStatus {
  readonly checks: {
    readonly database: "up" | "down";
  };
}

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  live(): HealthStatus {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }

  async ready(): Promise<ReadinessStatus> {
    const timestamp = new Date().toISOString();
    const databaseUp = await this.isDatabaseUp();

    return {
      status: databaseUp ? "ok" : "error",
      timestamp,
      checks: {
        database: databaseUp ? "up" : "down"
      }
    };
  }

  private async isDatabaseUp(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
