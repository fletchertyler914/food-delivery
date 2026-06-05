import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, type JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { RefreshTokenRetentionService } from "./refresh-token-retention.service";
import { RefreshTokenService } from "./refresh-token.service";

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        const expiresIn = (config.get<string>("JWT_ACCESS_TTL") ??
          "15m") as JwtModuleOptions["signOptions"] extends { expiresIn?: infer T } ? T : never;

        return {
          secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
          signOptions: { expiresIn }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, RefreshTokenRetentionService, JwtStrategy],
  exports: [JwtModule, RefreshTokenService]
})
export class AuthModule {}
