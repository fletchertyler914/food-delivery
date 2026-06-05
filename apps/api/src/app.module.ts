import path from "node:path";

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";

import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { validateEnv } from "./config/env.validation";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { BlocksModule } from "./modules/blocks/blocks.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { MealsModule } from "./modules/meals/meals.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { RestaurantsModule } from "./modules/restaurants/restaurants.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: path.resolve(__dirname, "../../../.env")
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
        skipIf: () => process.env["NODE_ENV"] === "test"
      }
    ]),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>("NODE_ENV");
        const pinoHttp = {
          level: nodeEnv === "test" ? "silent" : nodeEnv === "production" ? "info" : "debug",
          redact: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.passwordHash",
            "req.body.refreshToken"
          ]
        };

        return {
          pinoHttp:
            nodeEnv === "production" || nodeEnv === "test"
              ? pinoHttp
              : {
                  ...pinoHttp,
                  transport: {
                    target: "pino-pretty",
                    options: { singleLine: true }
                  }
                }
        };
      }
    }),
    EventEmitterModule.forRoot({ wildcard: false }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    MealsModule,
    CouponsModule,
    BlocksModule,
    OrdersModule,
    NotificationsModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule implements NestModule {
  // Request-id middleware must run before every controller route so
  // pino-http's generated `req.id` is mirrored back to clients via
  // `X-Request-Id` and surfaced inside ProblemDetails responses.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
