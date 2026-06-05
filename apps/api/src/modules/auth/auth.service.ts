import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User, UserRole } from "@prisma/client";

import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidTokenLookupError,
  WeakPasswordError
} from "../../common/errors/auth.errors";
import { UsersService } from "../users/users.service";
import { DUMMY_PASSWORD_HASH } from "./auth.constants";
import { assertPasswordPolicy } from "./domain/password-policy";
import { RefreshTokenService } from "./refresh-token.service";

export interface SignupInput {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly role: UserRole;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface AuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: { id: string; email: string; name: string; role: UserRole };
}

interface AccessTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService
  ) {}

  async signup(input: SignupInput): Promise<AuthResult> {
    const policy = assertPasswordPolicy(input.password);
    if (!policy.ok) {
      throw new WeakPasswordError(policy.reason);
    }

    const user = await this.users.create(input);
    return this.issueTokens(user);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);
    const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const ok = await this.users.verifyPassword(input.password, hash);

    if (!user || !ok) {
      throw new InvalidCredentialsError();
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let record;
    try {
      record = await this.refreshTokens.consume(refreshToken);
    } catch (error) {
      if (error instanceof InvalidTokenLookupError) {
        throw new InvalidRefreshTokenError();
      }
      throw error;
    }

    const user = await this.users.findById(record.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(refreshToken, userId);
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = await this.jwt.signAsync(payload);
    const { token: refreshToken } = await this.refreshTokens.issue(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }
}
