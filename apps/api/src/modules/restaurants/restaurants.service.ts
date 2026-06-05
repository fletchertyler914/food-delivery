import { Injectable } from "@nestjs/common";
import type { Restaurant } from "@prisma/client";

import {
  ResourceForbiddenError,
  RestaurantNotFoundError
} from "../../common/errors/resource.errors";
import { PAGE_DEFAULT_TAKE } from "../../common/pagination/page-query.dto";
import type { PaginatedResult } from "../../common/pagination/paginated-response.dto";
import { paginateSlice } from "../../common/pagination/paginated-response.dto";
import { pickDefined } from "../../common/util/pick-defined";
import { assertNonEmptyUpdate } from "../../common/util/assert-non-empty-update";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import type { UpdateRestaurantDto } from "./dto/update-restaurant.dto";

export interface ListRestaurantsOptions {
  readonly ownerId?: string;
  readonly take?: number;
  readonly cursor?: string;
}

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(options: ListRestaurantsOptions = {}): Promise<PaginatedResult<Restaurant>> {
    const requested = options.take ?? PAGE_DEFAULT_TAKE;
    const restaurants = await this.prisma.restaurant.findMany({
      ...(options.ownerId !== undefined && { where: { ownerId: options.ownerId } }),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: requested + 1,
      ...(options.cursor !== undefined && { skip: 1, cursor: { id: options.cursor } })
    });

    return paginateSlice(restaurants, requested);
  }

  async getById(id: string): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new RestaurantNotFoundError(id);
    }
    return restaurant;
  }

  async getOwned(id: string, ownerId: string): Promise<Restaurant> {
    const restaurant = await this.getById(id);
    if (restaurant.ownerId !== ownerId) {
      throw new ResourceForbiddenError("You do not own this restaurant.");
    }
    return restaurant;
  }

  create(ownerId: string, dto: CreateRestaurantDto): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl })
      }
    });
  }

  async update(id: string, ownerId: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    await this.getOwned(id, ownerId);
    const data = pickDefined({
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl
    });
    assertNonEmptyUpdate(data);
    return this.prisma.restaurant.update({
      where: { id },
      data
    });
  }
}
