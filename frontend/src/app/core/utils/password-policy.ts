/**
 * Strong password policy shared by Register and Forgot-password.
 * Each rule is a labelled check so the UI can render a live checklist,
 * and `validatePassword()` can return the first failure as an error message.
 * Keep this in sync with the backend policy when it is integrated.
 */
export const PASSWORD_MIN_LENGTH = 10;

const COMMON_PASSWORDS = ['password', 'qwerty', '123456', 'letmein', 'welcome', 'admin', 'iloveyou', 'abc123'];

export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

/** Personal values (name, email, mobile) the password must not contain. */
export function evaluatePassword(password: string, personal: string[] = []): PasswordRule[] {
  const lower = password.toLowerCase();
  const tokens = personal
    .map(p => p.trim().toLowerCase())
    .filter(p => p.length >= 3);
  return [
    { id: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters`, passed: password.length >= PASSWORD_MIN_LENGTH },
    { id: 'upper', label: 'One uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
    { id: 'lower', label: 'One lowercase letter (a-z)', passed: /[a-z]/.test(password) },
    { id: 'digit', label: 'One number (0-9)', passed: /\d/.test(password) },
    { id: 'symbol', label: 'One special character (!@#$%…)', passed: /[^A-Za-z0-9\s]/.test(password) },
    { id: 'space', label: 'No spaces', passed: password.length > 0 && !/\s/.test(password) },
    {
      id: 'common',
      label: 'Not a common password or your name/email/mobile',
      passed:
        password.length > 0 &&
        !COMMON_PASSWORDS.some(c => lower.includes(c)) &&
        !tokens.some(t => lower.includes(t))
    }
  ];
}

/** Returns an error message for the first failed rule, or null when the password is strong. */
export function validatePassword(password: string, personal: string[] = []): string | null {
  const failed = evaluatePassword(password, personal).find(r => !r.passed);
  return failed ? `Password rule not met: ${failed.label}.` : null;
}
