import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PageQueryDto } from "../../common/pagination/page-query.dto";
import { paginatedResponse, mapPaginated } from "../../common/pagination/paginated-response.dto";
import { ApiErrorResponses } from "../../common/swagger/api-error-responses.decorator";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { OwnerRestaurantResponseDto, RestaurantResponseDto } from "./dto/restaurant.response";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantsService } from "./restaurants.service";

const PaginatedRestaurantResponseDto = paginatedResponse(RestaurantResponseDto);

const PaginatedOwnerRestaurantResponseDto = paginatedResponse(OwnerRestaurantResponseDto);

// Restaurants are not deletable: orders reference them via FK Restrict
// and historical orders must remain queryable. Owners can edit or stop
// listing meals/coupons, but the restaurant record persists.
@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  @Public()
  @Get()
  @ApiOperation({
    operationId: "listRestaurants",
    summary: "List all restaurants (public catalog)."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedRestaurantResponseDto })
  @ApiErrorResponses(400)
  async list(
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedRestaurantResponseDto>> {
    return mapPaginated(
      await this.restaurants.list({
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (restaurant) => RestaurantResponseDto.from(restaurant)
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Get("mine")
  @ApiOperation({
    operationId: "listMyRestaurants",
    summary: "List the restaurants owned by the authenticated owner."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedOwnerRestaurantResponseDto })
  @ApiErrorResponses(401, 403)
  async listMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedOwnerRestaurantResponseDto>> {
    return mapPaginated(
      await this.restaurants.list({
        ownerId: user.id,
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (restaurant) => OwnerRestaurantResponseDto.from(restaurant)
    );
  }

  @Public()
  @Get(":id")
  @ApiOperation({ operationId: "getRestaurant", summary: "Get a single restaurant by id." })
  @ApiResponse({ status: HttpStatus.OK, type: RestaurantResponseDto })
  @ApiErrorResponses(404)
  async get(@Param("id") id: string): Promise<RestaurantResponseDto> {
    return RestaurantResponseDto.from(await this.restaurants.getById(id));
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Post()
  @ApiOperation({
    operationId: "createRestaurant",
    summary: "Create a restaurant owned by the authenticated user."
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: OwnerRestaurantResponseDto })
  @ApiErrorResponses(400, 401, 403)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRestaurantDto
  ): Promise<OwnerRestaurantResponseDto> {
    return OwnerRestaurantResponseDto.from(await this.restaurants.create(user.id, dto));
  }

  @ApiBearerAuth()
  @Roles(UserRole.OWNER)
  @Patch(":id")
  @ApiOperation({
    operationId: "updateRestaurant",
    summary: "Update a restaurant owned by the authenticated user."
  })
  @ApiResponse({ status: HttpStatus.OK, type: OwnerRestaurantResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateRestaurantDto
  ): Promise<OwnerRestaurantResponseDto> {
    return OwnerRestaurantResponseDto.from(await this.restaurants.update(id, user.id, dto));
  }
}
