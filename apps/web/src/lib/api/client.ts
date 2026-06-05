import type { ApiProblem } from "@food-delivery/api-client";

import { useAuthStore } from "../../features/auth/auth.store";

// All API calls are same-origin: in production the web nginx proxies
// /api/ and /socket.io/ to the API service; in dev the Vite proxy
// does the same. The bundle therefore uses relative paths only —
// there is no API host baked into the build. `credentials: "include"`
// is required so the httponly refresh cookie travels with every
// request, including the silent refresh inside this module.
export class ApiError extends Error {
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  readonly auth?: boolean;
  readonly body?: unknown;
  // Some callers (auth.api.refreshSession) want to opt out of the
  // retry loop to avoid infinite recursion when the refresh itself
  // returns 401.
  readonly retryOnUnauthorized?: boolean;
}

// Dedupe concurrent refresh attempts. Without this every queued
// request that races a 401 fires its own /auth/refresh and the server
// only honours the first one (atomic consume), invalidating the rest.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) {
        useAuthStore.getState().clearSession();
        return null;
      }
      const session = (await response.json()) as { accessToken: string };
      useAuthStore.getState().setAccessToken(session.accessToken);
      return session.accessToken;
    } catch {
      useAuthStore.getState().clearSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function shouldAttemptRefresh(problem: ApiProblem): boolean {
  return problem.code === "ACCESS_TOKEN_EXPIRED" || problem.code === "INVALID_BEARER";
}

function redirectToLogin(): never {
  const from = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?from=${encodeURIComponent(from)}`);
  throw new Error("Redirecting to login");
}

async function parseProblemResponse(response: Response): Promise<ApiProblem> {
  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/problem+json") ||
    contentType.includes("application/json")
  ) {
    try {
      return (await response.json()) as ApiProblem;
    } catch {
      // Fall through to synthetic problem below.
    }
  }

  return {
    type: `https://food-delivery.local/problems/http-${String(response.status)}`,
    title: response.statusText || "Request failed",
    status: response.status,
    code: `HTTP_${String(response.status)}`
  };
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = true, body, headers, retryOnUnauthorized = true, ...init } = options;

  const buildHeaders = (token?: string | null): Headers => {
    const next = new Headers(headers);
    if (body !== undefined) {
      next.set("Content-Type", "application/json");
    }
    if (auth) {
      const value = token ?? useAuthStore.getState().accessToken;
      if (value) {
        next.set("Authorization", `Bearer ${value}`);
      } else {
        next.delete("Authorization");
      }
    }
    return next;
  };

  const execute = async (tokenOverride?: string | null): Promise<Response> =>
    fetch(path, {
      ...init,
      credentials: "include",
      headers: buildHeaders(tokenOverride),
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });

  let response = await execute();

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const problem = await parseProblemResponse(response.clone());
    if (shouldAttemptRefresh(problem)) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        response = await execute(nextToken);
      } else {
        redirectToLogin();
      }
    }
  }

  if (!response.ok) {
    const problem = await parseProblemResponse(response);
    throw new ApiError(problem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
