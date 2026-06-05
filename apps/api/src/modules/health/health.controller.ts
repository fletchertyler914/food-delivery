import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  ServiceUnavailableException,
  VERSION_NEUTRAL
} from "@nestjs/common";

import { Public } from "../../common/decorators/public.decorator";

import { HealthService, type ReadinessStatus, type HealthStatus } from "./health.service";

@Public()
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get("live")
  @HttpCode(HttpStatus.OK)
  live(): HealthStatus {
    return this.health.live();
  }

  @Get("ready")
  async ready(): Promise<ReadinessStatus> {
    const status = await this.health.ready();
    if (status.status === "error") {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }
}
