export interface PasswordPolicyViolation {
  readonly ok: false;
  readonly reason: string;
}

export interface PasswordPolicyOk {
  readonly ok: true;
}

export type PasswordPolicyResult = PasswordPolicyOk | PasswordPolicyViolation;

export const PASSWORD_MIN_LENGTH = 12;

export function assertPasswordPolicy(password: string): PasswordPolicyResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      reason: `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters long.`
    };
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (!hasLetter || !hasDigit) {
    return {
      ok: false,
      reason: "Password must contain at least one letter and one digit."
    };
  }

  return { ok: true };
}
