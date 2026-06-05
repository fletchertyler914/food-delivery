import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { InvalidRefreshTokenError } from "../../common/errors/auth.errors";
import { ApiErrorResponses } from "../../common/swagger/api-error-responses.decorator";
import { AuthService, type AuthResult } from "./auth.service";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  refreshCookieOptions,
  setRefreshTokenCookie
} from "./refresh-token.cookie";

function toAuthResponse(result: AuthResult): AuthResponseDto {
  return { accessToken: result.accessToken, user: result.user };
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Post("signup")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: "signup", summary: "Create an account and receive auth tokens." })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponseDto })
  @ApiErrorResponses(400, 429)
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponseDto> {
    const result = await this.auth.signup(dto);
    this.attachRefreshCookie(response, result.refreshToken);
    return toAuthResponse(result);
  }

  @Public()
  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: "login", summary: "Exchange email and password for auth tokens." })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto })
  @ApiErrorResponses(400, 401, 429)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponseDto> {
    const result = await this.auth.login(dto);
    this.attachRefreshCookie(response, result.refreshToken);
    return toAuthResponse(result);
  }

  @Public()
  @Post("refresh")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: "refresh",
    summary: "Rotate the refresh cookie for a fresh access token."
  })
  @ApiResponse({ status: HttpStatus.OK, type: AuthResponseDto })
  @ApiErrorResponses(401, 429)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthResponseDto> {
    const token = readRefreshTokenCookie(request);
    if (!token) {
      this.clearRefreshCookie(response);
      throw new InvalidRefreshTokenError();
    }

    const result = await this.auth.refresh(token);
    this.attachRefreshCookie(response, result.refreshToken);
    return toAuthResponse(result);
  }

  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: "logout",
    summary: "Revoke the refresh cookie belonging to the caller."
  })
  @ApiErrorResponses(401)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    const token = readRefreshTokenCookie(request);
    if (token) {
      await this.auth.logout(user.id, token);
    }
    this.clearRefreshCookie(response);
  }

  private attachRefreshCookie(response: Response, refreshToken: string): void {
    const ttlDays = Number(this.config.get<string>("JWT_REFRESH_TTL_DAYS") ?? "30");
    setRefreshTokenCookie(
      response,
      refreshToken,
      refreshCookieOptions(ttlDays, this.config.get<string>("NODE_ENV"))
    );
  }

  private clearRefreshCookie(response: Response): void {
    clearRefreshTokenCookie(response, this.config.get<string>("NODE_ENV") === "production");
  }
}
