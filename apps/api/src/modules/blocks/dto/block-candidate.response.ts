import { ApiProperty } from "@nestjs/swagger";

export class BlockCandidateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}
