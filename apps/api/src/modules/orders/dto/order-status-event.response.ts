import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OrderStatus, UserRole, type OrderStatusEvent } from "@prisma/client";

export class OrderStatusEventResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderId!: string;

  @ApiPropertyOptional({ enum: OrderStatus, nullable: true })
  fromStatus!: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus })
  toStatus!: OrderStatus;

  @ApiProperty()
  actorId!: string;

  @ApiProperty({ enum: UserRole })
  actorRole!: UserRole;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  static from(event: OrderStatusEvent): OrderStatusEventResponseDto {
    return {
      id: event.id,
      orderId: event.orderId,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
      actorRole: event.actorRole,
      createdAt: event.createdAt
    };
  }
}
