import { DomainError } from "./domain-error";

export class RegistrationFailedError extends DomainError {
  constructor() {
    super({
      code: "REGISTRATION_FAILED",
      message: "Unable to create account. Try a different email or sign in.",
      status: 400
    });
  }
}

export class AccessTokenExpiredError extends DomainError {
  constructor() {
    super({
      code: "ACCESS_TOKEN_EXPIRED",
      message: "Access token has expired.",
      status: 401
    });
  }
}

export class InvalidBearerError extends DomainError {
  constructor() {
    super({
      code: "INVALID_BEARER",
      message: "Bearer token is missing or invalid.",
      status: 401
    });
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
      status: 401
    });
  }
}

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super({
      code: "INVALID_REFRESH_TOKEN",
      message: "Refresh token is missing, expired, or has been revoked.",
      status: 401
    });
  }
}

export class WeakPasswordError extends DomainError {
  constructor(detail: string) {
    super({
      code: "WEAK_PASSWORD",
      message: "Password does not meet the minimum strength requirements.",
      status: 400,
      detail
    });
  }
}

// Internal signal raised by RefreshTokenService when the read-and-
// revoke roundtrip turns up no row. The auth service catches it and
// surfaces the user-facing `InvalidRefreshTokenError`; it is rendered
// directly only in service-to-service contexts.
export class InvalidTokenLookupError extends DomainError {
  constructor() {
    super({
      code: "INVALID_TOKEN_LOOKUP",
      message: "Refresh token not found, expired, or revoked.",
      status: 401
    });
  }
}
