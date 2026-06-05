import { ApiProperty } from "@nestjs/swagger";

export class BlockedCustomerDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}

export class BlockResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: BlockedCustomerDto })
  customer!: BlockedCustomerDto;
}
