import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PageQueryDto } from "../../common/pagination/page-query.dto";
import { paginatedResponse, mapPaginated } from "../../common/pagination/paginated-response.dto";
import { ApiErrorResponses } from "../../common/swagger/api-error-responses.decorator";
import { BlocksService } from "./blocks.service";
import { BlockCandidateResponseDto } from "./dto/block-candidate.response";
import { BlockResponseDto } from "./dto/block.response";

const PaginatedBlockResponseDto = paginatedResponse(BlockResponseDto);
const PaginatedBlockCandidateResponseDto = paginatedResponse(BlockCandidateResponseDto);

@ApiTags("blocks")
@ApiBearerAuth()
@Roles(UserRole.OWNER)
@Controller("blocks")
export class BlocksController {
  constructor(private readonly blocks: BlocksService) {}

  @Get()
  @ApiOperation({ operationId: "listBlocks", summary: "List customers the caller has blocked." })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedBlockResponseDto })
  @ApiErrorResponses(400, 401, 403)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedBlockResponseDto>> {
    return mapPaginated(
      await this.blocks.listForOwner(user.id, {
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (block) => block
    );
  }

  @Get("candidates")
  @ApiOperation({
    operationId: "listBlockCandidates",
    summary: "List customers who ordered from your restaurants and are not yet blocked."
  })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedBlockCandidateResponseDto })
  @ApiErrorResponses(400, 401, 403)
  async listCandidates(
    @CurrentUser() user: AuthenticatedUser,
    @Query() page: PageQueryDto
  ): Promise<InstanceType<typeof PaginatedBlockCandidateResponseDto>> {
    return mapPaginated(
      await this.blocks.listCandidatesForOwner(user.id, {
        ...(page.take !== undefined && { take: page.take }),
        ...(page.cursor !== undefined && { cursor: page.cursor })
      }),
      (candidate) => candidate
    );
  }

  @Post(":customerId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "blockCustomer",
    summary: "Block a customer from ordering from your restaurants."
  })
  @ApiErrorResponses(400, 401, 403, 404)
  async block(
    @Param("customerId") customerId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    await this.blocks.block(user.id, customerId);
  }

  @Delete(":customerId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "unblockCustomer",
    summary: "Unblock a previously blocked customer."
  })
  @ApiErrorResponses(401, 403, 404)
  async unblock(
    @Param("customerId") customerId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    await this.blocks.unblock(user.id, customerId);
  }
}
