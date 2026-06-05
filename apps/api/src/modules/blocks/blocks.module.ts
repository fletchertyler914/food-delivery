import { Module } from "@nestjs/common";

import { UsersModule } from "../users/users.module";
import { BlocksController } from "./blocks.controller";
import { BlocksService } from "./blocks.service";

@Module({
  imports: [UsersModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService]
})
export class BlocksModule {}
