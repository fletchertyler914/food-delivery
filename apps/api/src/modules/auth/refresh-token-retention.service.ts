import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { PrismaService } from "../../prisma/prisma.service";

// Window past expiry that we keep refresh-token rows around for. The
// `consume` flow already rejects expired rows on read, so the only
// reasons to retain them are forensic ("when did this user last
// rotate?") and audit replay. After 7 days they have no operational
// value and just inflate the table + the `expiresAt` btree.
const RETENTION_GRACE_DAYS = 7;

@Injectable()
export class RefreshTokenRetentionService {
  private readonly logger = new Logger(RefreshTokenRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Daily at 03:00 UTC. Idempotent — running it more often is also
  // safe; this just keeps the steady-state delete batch small.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async pruneExpired(): Promise<void> {
    const cutoff = this.cutoff();
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: cutoff } }
    });

    if (result.count > 0) {
      this.logger.log(
        { deleted: result.count, cutoff: cutoff.toISOString() },
        "Pruned expired refresh tokens"
      );
    }
  }

  // Exposed for tests + ad-hoc admin invocations.
  cutoff(now: Date = new Date()): Date {
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_GRACE_DAYS);
    return cutoff;
  }
}
