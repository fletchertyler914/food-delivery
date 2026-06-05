import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus, type Order, type OrderItem } from "@prisma/client";

export class OrderRestaurantSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({
    description: "Restaurant owner user id — used to derive order action permissions in clients."
  })
  ownerId!: string;
}

export class OrderItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  mealId!: string;

  @ApiProperty()
  nameSnapshot!: string;

  @ApiProperty({ description: "Price per unit at order placement, in integer cents." })
  priceCentsSnapshot!: number;

  @ApiProperty({ minimum: 1 })
  quantity!: number;

  static from(item: OrderItem): OrderItemResponseDto {
    return {
      id: item.id,
      mealId: item.mealId,
      nameSnapshot: item.nameSnapshot,
      priceCentsSnapshot: item.priceCentsSnapshot,
      quantity: item.quantity
    };
  }
}

export class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty()
  restaurantId!: string;

  @ApiProperty({ type: OrderRestaurantSummaryDto })
  restaurant!: OrderRestaurantSummaryDto;

  @ApiPropertyOptional({ nullable: true })
  couponId!: string | null;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  tipCents!: number;

  @ApiProperty()
  subtotalCents!: number;

  @ApiProperty()
  discountCents!: number;

  @ApiProperty()
  totalCents!: number;

  @ApiProperty({ type: OrderItemResponseDto, isArray: true })
  items!: OrderItemResponseDto[];

  @ApiProperty({ type: String, format: "date-time" })
  placedAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  static from(
    order: Order & {
      items: OrderItem[];
      restaurant: { id: string; name: string; imageUrl: string | null; ownerId: string };
    }
  ): OrderResponseDto {
    return {
      id: order.id,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      restaurant: {
        id: order.restaurant.id,
        name: order.restaurant.name,
        imageUrl: order.restaurant.imageUrl,
        ownerId: order.restaurant.ownerId
      },
      couponId: order.couponId,
      status: order.status,
      tipCents: order.tipCents,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      items: order.items.map((item) => OrderItemResponseDto.from(item)),
      placedAt: order.placedAt,
      updatedAt: order.updatedAt
    };
  }
}

export class DuplicateOrderResponseDto {
  @ApiProperty({ type: OrderResponseDto })
  order!: OrderResponseDto;

  @ApiProperty({
    type: String,
    isArray: true,
    description: "Names of meals that were dropped because they are no longer active."
  })
  droppedMealNames!: string[];
}
