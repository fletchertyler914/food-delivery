import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";

import { ResourceForbiddenError } from "../errors/resource.errors";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles =
      this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new ResourceForbiddenError("Authentication required for this resource.");
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ResourceForbiddenError("Insufficient role for this resource.");
    }

    return true;
  }
}
