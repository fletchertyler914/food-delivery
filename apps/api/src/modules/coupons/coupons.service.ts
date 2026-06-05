import { Injectable } from "@nestjs/common";
import { Prisma, type Coupon } from "@prisma/client";

import {
  CouponCodeTakenError,
  CouponInactiveError,
  CouponNotFoundError
} from "../../common/errors/coupon.errors";
import { PAGE_DEFAULT_TAKE } from "../../common/pagination/page-query.dto";
import type { PaginatedResult } from "../../common/pagination/paginated-response.dto";
import { paginateSlice } from "../../common/pagination/paginated-response.dto";
import { pickDefined } from "../../common/util/pick-defined";
import { assertNonEmptyUpdate } from "../../common/util/assert-non-empty-update";
import { PrismaService } from "../../prisma/prisma.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import type { CreateCouponDto } from "./dto/create-coupon.dto";
import type { UpdateCouponDto } from "./dto/update-coupon.dto";

const PRISMA_UNIQUE_VIOLATION = "P2002";

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurants: RestaurantsService
  ) {}

  async listByRestaurant(
    restaurantId: string,
    ownerId: string,
    options: { take?: number; cursor?: string } = {}
  ): Promise<PaginatedResult<Coupon>> {
    await this.restaurants.getOwned(restaurantId, ownerId);
    const requested = options.take ?? PAGE_DEFAULT_TAKE;
    const coupons = await this.prisma.coupon.findMany({
      where: { restaurantId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: requested + 1,
      ...(options.cursor !== undefined && { skip: 1, cursor: { id: options.cursor } })
    });

    return paginateSlice(coupons, requested);
  }

  async getById(id: string): Promise<Coupon> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new CouponNotFoundError(`No coupon with id ${id}.`);
    }
    return coupon;
  }

  async resolveForOrder(restaurantId: string, code: string): Promise<Coupon> {
    const normalized = normalizeCouponCode(code);
    // Look up by (restaurantId, code) without filtering on `isActive`
    // so we can distinguish "no such coupon" (404) from "the coupon
    // exists but is no longer redeemable" (400). The two map to
    // different domain errors and different problem+json codes.
    const coupon = await this.prisma.coupon.findFirst({
      where: { restaurantId, code: normalized }
    });

    if (!coupon) {
      throw new CouponNotFoundError(`No coupon with code ${normalized}.`);
    }

    if (!coupon.isActive) {
      throw new CouponInactiveError(normalized);
    }

    return coupon;
  }

  async create(restaurantId: string, ownerId: string, dto: CreateCouponDto): Promise<Coupon> {
    await this.restaurants.getOwned(restaurantId, ownerId);
    const code = normalizeCouponCode(dto.code);

    try {
      return await this.prisma.coupon.create({
        data: {
          restaurantId,
          code,
          percentOff: dto.percentOff
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_VIOLATION
      ) {
        throw new CouponCodeTakenError(code);
      }
      throw error;
    }
  }

  async update(id: string, ownerId: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.getById(id);
    await this.restaurants.getOwned(coupon.restaurantId, ownerId);
    const data = pickDefined({ percentOff: dto.percentOff, isActive: dto.isActive });
    assertNonEmptyUpdate(data);
    return this.prisma.coupon.update({
      where: { id },
      data
    });
  }

  async deactivate(id: string, ownerId: string): Promise<Coupon> {
    const coupon = await this.getById(id);
    await this.restaurants.getOwned(coupon.restaurantId, ownerId);
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }
}
