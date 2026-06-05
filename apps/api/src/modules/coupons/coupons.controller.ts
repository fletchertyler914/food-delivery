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
import { CouponsService } from "./coupons.service";
import { CouponPreviewQueryDto } from "./dto/coupon-preview-query.dto";
import { CouponPreviewResponseDto } from "./dto/coupon-preview.response";
import { CouponResponseDto } from "./dto/coupon.response";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { UpdateCouponDto } from "./dto/update-coupon.dto";

const PaginatedCouponResponseDto = paginatedResponse(CouponResponseDto);

@ApiTags("coupons")
@ApiBearerAuth()
@Controller()
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  // Public so guests (who haven't signed in yet) can validate a coupon
  // from the cart and see the discount before committing to checkout.
  // Knowing the code is the only thing required — codes are promo
  // material meant to be shared — so this leaks nothing sensitive.
  @Public()
  @Get("restaurants/:restaurantId/coupons/preview")
  @ApiOperation({
    operationId: "previewCoupon",
    summary: "Validate a coupon code for a restaurant and return its discount."
  })
  @ApiResponse({ status: HttpStatus.OK, type: CouponPreviewResponseDto })
  @ApiErrorResponses(400, 404)
  async preview(
    @Param("restaurantId") restaurantId: string,
    @Query() query: CouponPreviewQueryDto
  ): Promise<CouponPreviewResponseDto> {
    return CouponPreviewResponseDto.from(
      await this.coupons.resolveForOrder(restaurantId, query.code)
    );
  }

  @Roles(UserRole.OWNER)
  @Get("restaurants/:restaurantId/coupons")
  @ApiOperation({
    operationId: "listRestaurantCoupons",
    summary: "List coupons for a restaurant the caller owns."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedCouponResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async list(
    @Param("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedCouponResponseDto>> {
    return mapPaginated(
      await this.coupons.listByRestaurant(restaurantId, user.id, {
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (coupon) => CouponResponseDto.from(coupon)
    );
  }

  @Roles(UserRole.OWNER)
  @Post("restaurants/:restaurantId/coupons")
  @ApiOperation({
    operationId: "createCoupon",
    summary: "Create a coupon for a restaurant the caller owns."
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CouponResponseDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  async create(
    @Param("restaurantId") restaurantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCouponDto
  ): Promise<CouponResponseDto> {
    return CouponResponseDto.from(await this.coupons.create(restaurantId, user.id, dto));
  }

  @Roles(UserRole.OWNER)
  @Patch("coupons/:id")
  @ApiOperation({ operationId: "updateCoupon", summary: "Update a coupon owned by the caller." })
  @ApiResponse({ status: HttpStatus.OK, type: CouponResponseDto })
  @ApiErrorResponses(400, 401, 403, 404)
  async update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCouponDto
  ): Promise<CouponResponseDto> {
    return CouponResponseDto.from(await this.coupons.update(id, user.id, dto));
  }

  @Roles(UserRole.OWNER)
  @Delete("coupons/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "deactivateCoupon",
    summary: "Deactivate a coupon owned by the caller."
  })
  @ApiErrorResponses(401, 403, 404)
  async deactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.coupons.deactivate(id, user.id);
  }
}
