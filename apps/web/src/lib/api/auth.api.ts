import type { AuthResponse, LoginInput, SignupInput } from "./types";
import { apiRequest } from "./client";

// Cookie-based auth: login/signup set an httponly refresh cookie that
// the browser attaches automatically to subsequent /auth/refresh and
// /auth/logout calls. The SPA never handles a refresh token directly,
// so none of these methods receive or return one.

export function signup(input: SignupInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/signup", {
    method: "POST",
    auth: false,
    body: input
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: input
  });
}

export async function logout(): Promise<void> {
  await apiRequest("/api/v1/auth/logout", { method: "POST" });
}

export function refreshSession(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/v1/auth/refresh", {
    method: "POST",
    auth: false,
    retryOnUnauthorized: false
  });
}
