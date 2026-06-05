import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { OrderAccessRecord } from "../../modules/orders/orders.service";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import { OrderNotFoundError } from "../errors/order.errors";
import { ResourceForbiddenError } from "../errors/resource.errors";

// Property key under which the guard attaches the loaded order to
// the request. Controllers + services type their request augmentation
// against this key so the order can be reused without re-fetching.
export const ORDER_ACCESS_REQUEST_KEY = "orderAccessRecord" as const;

export interface OrderAccessRequest {
  params: { id?: string };
  user?: AuthenticatedUser;
  [ORDER_ACCESS_REQUEST_KEY]?: OrderAccessRecord;
}

@Injectable()
export class OrderAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrderAccessRequest>();
    const orderId = request.params.id;
    const user = request.user;

    if (!orderId) {
      throw new OrderNotFoundError("unknown");
    }

    if (!user) {
      throw new ResourceForbiddenError("You must be authenticated to access this order.");
    }

    // Load the full order shape the downstream service expects so a
    // single roundtrip serves both the access check and the response.
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        restaurant: { select: { id: true, name: true, ownerId: true, imageUrl: true } }
      }
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const isCustomerOf = order.customerId === user.id;
    const isOwnerOf = order.restaurant.ownerId === user.id;

    if (!isCustomerOf && !isOwnerOf) {
      throw new ResourceForbiddenError("You do not have access to this order.");
    }

    request[ORDER_ACCESS_REQUEST_KEY] = order;
    return true;
  }
}
