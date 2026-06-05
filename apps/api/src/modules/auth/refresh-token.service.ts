import { createHash, randomBytes } from "node:crypto";

import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { RefreshToken } from "@prisma/client";

import { InvalidTokenLookupError } from "../../common/errors/auth.errors";
import { PrismaService } from "../../prisma/prisma.service";

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class RefreshTokenService {
  private readonly ttlDays: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) config: ConfigService
  ) {
    this.ttlDays = Number(config.get<string>("JWT_REFRESH_TTL_DAYS") ?? "30");
  }

  async issue(userId: string): Promise<{ token: string; record: RefreshToken }> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    const record = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: this.expiresAt()
      }
    });

    return { token, record };
  }

  async consume(token: string): Promise<RefreshToken> {
    // Atomic read-and-revoke: two concurrent refresh requests with the
    // same token can't both pass. `tokenHash` is `@@unique` so the
    // update touches exactly one row when a valid token exists; the
    // returning row is then loaded by id for the caller. If revokedAt
    // is already set or expiresAt has passed, updateMany matches zero
    // rows and we surface a typed lookup error.
    const tokenHash = this.hash(token);
    const now = new Date();
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now }
    });

    if (result.count === 0) {
      throw new InvalidTokenLookupError();
    }

    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record) {
      throw new InvalidTokenLookupError();
    }
    return record;
  }

  async revoke(token: string, userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private expiresAt(): Date {
    const expires = new Date();
    expires.setUTCDate(expires.getUTCDate() + this.ttlDays);
    return expires;
  }
}
