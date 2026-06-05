import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  }
);
