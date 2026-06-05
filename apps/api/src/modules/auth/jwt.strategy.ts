import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { UserRole } from "@prisma/client";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(ConfigService) config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET")
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  }
}
