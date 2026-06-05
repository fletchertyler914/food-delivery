import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PageQueryDto } from "../../common/pagination/page-query.dto";
import { paginatedResponse, mapPaginated } from "../../common/pagination/paginated-response.dto";
import { ApiErrorResponses } from "../../common/swagger/api-error-responses.decorator";
import { CreateMealDto } from "./dto/create-meal.dto";
import { MealResponseDto } from "./dto/meal.response";
import { UpdateMealDto } from "./dto/update-meal.dto";
import { MealsService } from "./meals.service";

const PaginatedMealResponseDto = paginatedResponse(MealResponseDto);

@ApiTags("meals")
@Controller()
export class MealsController {
  constructor(private readonly meals: MealsService) {}

  @Public()
  @Get("restaurants/:restaurantId/meals")
  @ApiOperation({
    operationId: "listRestaurantMeals",
    summary: "List active meals for a restaurant. Public; never returns inactive."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedMealResponseDto })
  @ApiErrorResponses(400, 404)
  async listActiveByRestaurant(
    @Param("restaurantId") restaurantId: string,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedMealResponseDto>> {
    return mapPaginated(
      await this.meals.listByRestaurant(restaurantId, {
        includeInactive: false,
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (meal) => MealResponseDto.from(meal)
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Get("restaurants/:restaurantId/meals/all")
  @ApiOperation({
    operationId: "listAllRestaurantMealsForOwner",
    summary: "List all meals (active and inactive) for a restaurant owned by the caller."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedMealResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async listAllByRestaurant(
    @Param("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedMealResponseDto>> {
    return mapPaginated(
      await this.meals.listByRestaurantForOwner(restaurantId, user.id, {
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (meal) => MealResponseDto.from(meal)
    );
  }

  @Public()
  @Get("meals/:id")
  @ApiOperation({ operationId: "getMeal", summary: "Get a single active meal by id." })
  @ApiResponse({ status: HttpStatus.OK, type: MealResponseDto })
  @ApiErrorResponses(404)
  async get(@Param("id") id: string): Promise<MealResponseDto> {
    return MealResponseDto.from(await this.meals.getActiveById(id));
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Post("restaurants/:restaurantId/meals")
  @ApiOperation({
    operationId: "createMeal",
    summary: "Create a meal in a restaurant owned by the caller."
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: MealResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async create(
    @Param("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMealDto
  ): Promise<MealResponseDto> {
    return MealResponseDto.from(await this.meals.create(restaurantId, user.id, dto));
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Patch("meals/:id")
  @ApiOperation({
    operationId: "updateMeal",
    summary: "Update a meal owned by the caller's restaurant."
  })
  @ApiResponse({ status: HttpStatus.OK, type: MealResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMealDto
  ): Promise<MealResponseDto> {
    return MealResponseDto.from(await this.meals.update(id, user.id, dto));
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Delete("meals/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "deactivateMeal",
    summary: "Deactivate a meal (preserves order history)."
  })
  @ApiErrorResponses(401, 403, 404)
  async deactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.meals.deactivate(id, user.id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Post("meals/:id/reactivate")
  @ApiOperation({
    operationId: "reactivateMeal",
    summary: "Reactivate a previously deactivated meal."
  })
  @ApiResponse({ status: HttpStatus.OK, type: MealResponseDto })
  @ApiErrorResponses(401, 403, 404)
  async reactivate(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<MealResponseDto> {
    return MealResponseDto.from(await this.meals.reactivate(id, user.id));
  }
}
