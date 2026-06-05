import { Injectable } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";

import {
  BlockNotFoundError,
  InvalidBlockTargetError,
  NoCustomerRelationshipError
} from "../../common/errors/block.errors";
import { PAGE_DEFAULT_TAKE } from "../../common/pagination/page-query.dto";
import type { PaginatedResult } from "../../common/pagination/paginated-response.dto";
import { paginateSlice } from "../../common/pagination/paginated-response.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import type { BlockResponseDto } from "./dto/block.response";

const PRISMA_UNIQUE_VIOLATION = "P2002";

@Injectable()
export class BlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService
  ) {}

  async listForOwner(
    ownerId: string,
    options: { take?: number; cursor?: string } = {}
  ): Promise<PaginatedResult<BlockResponseDto>> {
    const requested = options.take ?? PAGE_DEFAULT_TAKE;
    const blocks = await this.prisma.block.findMany({
      where: { ownerId },
      include: {
        customer: { select: { id: true, email: true, name: true } }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: requested + 1,
      ...(options.cursor !== undefined && { skip: 1, cursor: { id: options.cursor } })
    });

    const page = paginateSlice(blocks, requested);
    return {
      data: page.data.map((block) => ({
        id: block.id,
        ownerId: block.ownerId,
        customerId: block.customerId,
        createdAt: block.createdAt,
        customer: block.customer
      })),
      nextCursor: page.nextCursor
    };
  }

  async listCandidatesForOwner(
    ownerId: string,
    options: { take?: number; cursor?: string } = {}
  ): Promise<PaginatedResult<{ id: string; email: string; name: string }>> {
    const requested = options.take ?? PAGE_DEFAULT_TAKE;
    const customers = await this.prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER,
        orders: { some: { ownerId } },
        blockedByOwners: { none: { ownerId } }
      },
      select: { id: true, email: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: requested + 1,
      ...(options.cursor !== undefined && { skip: 1, cursor: { id: options.cursor } })
    });

    return paginateSlice(customers, requested);
  }

  async block(ownerId: string, customerId: string): Promise<void> {
    await this.assertCustomer(customerId);
    await this.assertCustomerRelationship(ownerId, customerId);

    try {
      await this.prisma.block.create({
        data: { ownerId, customerId }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_VIOLATION
      ) {
        return;
      }
      throw error;
    }
  }

  async unblock(ownerId: string, customerId: string): Promise<void> {
    const deleted = await this.prisma.block.deleteMany({
      where: { ownerId, customerId }
    });
    if (deleted.count === 0) {
      throw new BlockNotFoundError(customerId);
    }
  }

  async isBlockedByAnyRestaurantOwner(
    customerId: string,
    restaurantOwnerId: string
  ): Promise<boolean> {
    const match = await this.prisma.block.findUnique({
      where: {
        ownerId_customerId: {
          ownerId: restaurantOwnerId,
          customerId
        }
      }
    });
    return match !== null;
  }

  private async assertCustomer(customerId: string): Promise<void> {
    const user = await this.users.findById(customerId);
    if (!user) {
      throw new InvalidBlockTargetError(`No user with id ${customerId}.`);
    }
    if (user.role !== UserRole.CUSTOMER) {
      throw new InvalidBlockTargetError(
        `User ${customerId} is not a customer (role=${user.role}).`
      );
    }
  }

  private async assertCustomerRelationship(ownerId: string, customerId: string): Promise<void> {
    const relationship = await this.prisma.order.findFirst({
      where: { ownerId, customerId },
      select: { id: true }
    });
    if (!relationship) {
      throw new NoCustomerRelationshipError(
        `Customer ${customerId} has not placed an order with owner ${ownerId}.`
      );
    }
  }
}
