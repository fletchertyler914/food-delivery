import { Injectable } from "@nestjs/common";
import type { Meal } from "@prisma/client";

import { MealNotFoundError, ResourceForbiddenError } from "../../common/errors/resource.errors";
import { PAGE_DEFAULT_TAKE } from "../../common/pagination/page-query.dto";
import type { PaginatedResult } from "../../common/pagination/paginated-response.dto";
import { paginateSlice } from "../../common/pagination/paginated-response.dto";
import { pickDefined } from "../../common/util/pick-defined";
import { assertNonEmptyUpdate } from "../../common/util/assert-non-empty-update";
import { PrismaService } from "../../prisma/prisma.service";
import { RestaurantsService } from "../restaurants/restaurants.service";
import type { CreateMealDto } from "./dto/create-meal.dto";
import type { UpdateMealDto } from "./dto/update-meal.dto";

export interface ListMealsOptions {
  readonly includeInactive?: boolean;
  readonly take?: number;
  readonly cursor?: string;
}

@Injectable()
export class MealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurants: RestaurantsService
  ) {}

  async listByRestaurant(
    restaurantId: string,
    options: ListMealsOptions = {}
  ): Promise<PaginatedResult<Meal>> {
    await this.restaurants.getById(restaurantId);
    return this.paginatedFind({
      where: {
        restaurantId,
        ...(options.includeInactive ? {} : { isActive: true })
      },
      ...(options.take !== undefined && { take: options.take }),
      ...(options.cursor !== undefined && { cursor: options.cursor })
    });
  }

  async listByRestaurantForOwner(
    restaurantId: string,
    ownerId: string,
    options: { take?: number; cursor?: string } = {}
  ): Promise<PaginatedResult<Meal>> {
    await this.restaurants.getOwned(restaurantId, ownerId);
    return this.paginatedFind({
      where: { restaurantId },
      ...(options.take !== undefined && { take: options.take }),
      ...(options.cursor !== undefined && { cursor: options.cursor })
    });
  }

  async getActiveById(id: string): Promise<Meal> {
    const meal = await this.prisma.meal.findFirst({ where: { id, isActive: true } });
    if (!meal) {
      throw new MealNotFoundError(id);
    }
    return meal;
  }

  async getById(id: string): Promise<Meal> {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) {
      throw new MealNotFoundError(id);
    }
    return meal;
  }

  async create(restaurantId: string, ownerId: string, dto: CreateMealDto): Promise<Meal> {
    await this.restaurants.getOwned(restaurantId, ownerId);
    return this.prisma.meal.create({
      data: {
        restaurantId,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl })
      }
    });
  }

  async update(id: string, ownerId: string, dto: UpdateMealDto): Promise<Meal> {
    const meal = await this.getById(id);
    await this.assertOwns(meal, ownerId);
    const data = pickDefined({
      name: dto.name,
      description: dto.description,
      priceCents: dto.priceCents,
      imageUrl: dto.imageUrl
    });
    assertNonEmptyUpdate(data);
    return this.prisma.meal.update({
      where: { id },
      data
    });
  }

  async deactivate(id: string, ownerId: string): Promise<Meal> {
    const meal = await this.getById(id);
    await this.assertOwns(meal, ownerId);
    return this.prisma.meal.update({ where: { id }, data: { isActive: false } });
  }

  async reactivate(id: string, ownerId: string): Promise<Meal> {
    const meal = await this.getById(id);
    await this.assertOwns(meal, ownerId);
    return this.prisma.meal.update({ where: { id }, data: { isActive: true } });
  }

  private async paginatedFind(opts: {
    where: { restaurantId: string; isActive?: boolean };
    take?: number;
    cursor?: string;
  }): Promise<PaginatedResult<Meal>> {
    const requested = opts.take ?? PAGE_DEFAULT_TAKE;
    const meals = await this.prisma.meal.findMany({
      where: opts.where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: requested + 1,
      ...(opts.cursor !== undefined && { skip: 1, cursor: { id: opts.cursor } })
    });

    return paginateSlice(meals, requested);
  }

  private async assertOwns(meal: Meal, ownerId: string): Promise<void> {
    const restaurant = await this.restaurants.getById(meal.restaurantId);
    if (restaurant.ownerId !== ownerId) {
      throw new ResourceForbiddenError("You do not own the restaurant for this meal.");
    }
  }
}
