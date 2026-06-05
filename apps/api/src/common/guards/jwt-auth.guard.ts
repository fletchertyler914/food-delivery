import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AccessTokenExpiredError, InvalidBearerError } from "../errors/auth.errors";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser>(
    err: Error | undefined,
    user: TUser | false,
    info: Error | undefined
  ): TUser {
    if (err) {
      throw err;
    }

    if (!user) {
      if (info?.name === "TokenExpiredError") {
        throw new AccessTokenExpiredError();
      }
      throw new InvalidBearerError();
    }

    return user;
  }
}
