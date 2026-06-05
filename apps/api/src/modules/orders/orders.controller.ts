import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserRole, OrderStatus } from "@prisma/client";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  ORDER_ACCESS_REQUEST_KEY,
  OrderAccessGuard,
  type OrderAccessRequest
} from "../../common/guards/order-access.guard";
import { paginatedResponse, mapPaginated } from "../../common/pagination/paginated-response.dto";
import { ApiErrorResponses } from "../../common/swagger/api-error-responses.decorator";
import { DuplicateOrderResponseDto, OrderResponseDto } from "./dto/order.response";
import { ListOrdersQueryDto } from "./dto/list-orders-query.dto";
import { OrderStatusEventResponseDto } from "./dto/order-status-event.response";
import { PlaceOrderDto } from "./dto/place-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { OrdersService, type ListOrdersPage, type ListOwnerOrdersPage } from "./orders.service";

const PaginatedOrderResponseDto = paginatedResponse(OrderResponseDto);

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(UserRole.CUSTOMER, UserRole.OWNER)
  @Post()
  @ApiOperation({ operationId: "placeOrder", summary: "Place a new order." })
  @ApiResponse({ status: HttpStatus.CREATED, type: OrderResponseDto })
  @ApiErrorResponses(400, 401, 403, 409)
  async place(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PlaceOrderDto
  ): Promise<OrderResponseDto> {
    return OrderResponseDto.from(await this.orders.place(user, dto));
  }

  @Roles(UserRole.CUSTOMER, UserRole.OWNER)
  @Get()
  @ApiOperation({
    operationId: "listOrders",
    summary: "List orders accessible to the caller (customer's own, or owner's restaurants)."
  })
  @ApiQuery({ name: "restaurantId", required: false, type: String })
  @ApiQuery({ name: "status", required: false, enum: OrderStatus, isArray: true })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedOrderResponseDto })
  @ApiErrorResponses(400, 401, 403)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto
  ): Promise<InstanceType<typeof PaginatedOrderResponseDto>> {
    const customerPage: ListOrdersPage = {
      ...(query.take !== undefined && { take: query.take }),
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      ...(query.status !== undefined && { status: query.status })
    };
    const ownerPage: ListOwnerOrdersPage = {
      ...customerPage,
      ...(query.restaurantId !== undefined && { restaurantId: query.restaurantId })
    };

    return mapPaginated(await this.orders.listAccessible(user, ownerPage), (order) =>
      OrderResponseDto.from(order)
    );
  }

  @Get(":id")
  @UseGuards(OrderAccessGuard)
  @ApiOperation({
    operationId: "getOrder",
    summary: "Get a single order; customer or restaurant owner only."
  })
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponseDto })
  @ApiErrorResponses(401, 403, 404)
  async get(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: OrderAccessRequest
  ): Promise<OrderResponseDto> {
    return OrderResponseDto.from(
      await this.orders.getAccessible(id, user, request[ORDER_ACCESS_REQUEST_KEY])
    );
  }

  @Get(":id/events")
  @UseGuards(OrderAccessGuard)
  @ApiOperation({
    operationId: "listOrderEvents",
    summary: "List status timeline events for an accessible order."
  })
  @ApiResponse({ status: HttpStatus.OK, type: OrderStatusEventResponseDto, isArray: true })
  @ApiErrorResponses(401, 403, 404)
  async listEvents(@Param("id") id: string): Promise<OrderStatusEventResponseDto[]> {
    const events = await this.orders.listStatusEvents(id);
    return events.map((event) => OrderStatusEventResponseDto.from(event));
  }

  @Patch(":id/status")
  @UseGuards(OrderAccessGuard)
  @ApiOperation({
    operationId: "updateOrderStatus",
    summary: "Transition the order to the next valid status."
  })
  @ApiResponse({ status: HttpStatus.OK, type: OrderResponseDto })
  @ApiErrorResponses(400, 401, 403, 404, 409)
  async updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: OrderAccessRequest
  ): Promise<OrderResponseDto> {
    const order = await this.orders.transition(
      id,
      user,
      dto.toStatus,
      request[ORDER_ACCESS_REQUEST_KEY]
    );
    return OrderResponseDto.from(order);
  }

  @Roles(UserRole.CUSTOMER, UserRole.OWNER)
  @Post(":id/duplicate")
  @UseGuards(OrderAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: "duplicateOrder",
    summary: "Duplicate one of the caller's prior orders using current meal prices."
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: DuplicateOrderResponseDto })
  @ApiErrorResponses(401, 403, 404, 409)
  async duplicate(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<DuplicateOrderResponseDto> {
    const result = await this.orders.duplicate(user, id);
    return {
      order: OrderResponseDto.from(result.order),
      droppedMealNames: result.droppedMealNames
    };
  }
}
