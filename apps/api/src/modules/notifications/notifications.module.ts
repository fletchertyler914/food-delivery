import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsListener } from "./notifications.listener";

@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway, NotificationsListener],
  exports: [NotificationsGateway]
})
export class NotificationsModule {}
