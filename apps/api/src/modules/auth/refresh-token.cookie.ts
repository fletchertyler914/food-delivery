import type { Request, Response } from "express";

export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const REFRESH_TOKEN_PATH = "/api/v1/auth";

export interface RefreshCookieOptions {
  readonly maxAgeSeconds: number;
  readonly secure: boolean;
}

export function setRefreshTokenCookie(
  response: Response,
  token: string,
  options: RefreshCookieOptions
): void {
  response.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: options.secure,
    sameSite: "lax",
    path: REFRESH_TOKEN_PATH,
    maxAge: options.maxAgeSeconds * 1_000
  });
}

export function clearRefreshTokenCookie(response: Response, secure: boolean): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: REFRESH_TOKEN_PATH
  });
}

export function readRefreshTokenCookie(request: Request): string | undefined {
  const cookies = request.cookies as Record<string, string | undefined> | undefined;
  const token = cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

export function refreshCookieOptions(
  ttlDays: number,
  nodeEnv: string | undefined
): RefreshCookieOptions {
  return {
    maxAgeSeconds: ttlDays * 86_400,
    secure: nodeEnv === "production"
  };
}
