import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../../models/society.model';
import { SocietyStateService } from '../../services/society-state.service';
import { environment } from '../../../environments/environment';
import { validatePassword } from '../utils/password-policy';

/** Security questions offered at registration; the answer is used by "Forgot password". */
export const HINT_QUESTIONS: readonly string[] = [
  'What was the name of your first pet?',
  'What is your mother\'s maiden name?',
  'What was the name of your first school?',
  'In which city were you born?',
  'What is your favourite childhood food?'
];

export type SocialProvider = 'google' | 'facebook';

export interface AuthAccount {
  username: string;
  /** DEMO ONLY: stored in plain text in localStorage. Replace with a real identity provider (OIDC/JWT) in production. */
  password: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  /** Normalised 10-digit mobile number. */
  mobile?: string;
  role: UserRole;
  /** Security question chosen at registration. */
  hintQuestion?: string;
  /** DEMO ONLY: normalised (trim + lowercase) answer. A real backend must store a salted hash. */
  hintAnswer?: string;
  /** Set when the account was created through Google/Facebook sign-in. */
  provider?: SocialProvider;
}

export interface AuthSession {
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Returned by `getHintQuestion()`. */
  question?: string;
}

/** Normalises a hint answer so "  Tommy " matches "tommy". */
const normalizeAnswer = (a: string): string => a.trim().toLowerCase();
/** Keeps only the 10 national digits (drops spaces, dashes, +91 / 0 prefix). */
export const normalizeMobile = (m: string): string => {
  const d = m.replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
};
/** Indian mobile numbers: 10 digits starting 6-9. */
export const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SESSION_KEY = 'sms_auth_session_v1';
const ACCOUNTS_KEY = 'sms_auth_accounts_v1';

/** Built-in dummy account: username `demo` / password `demo` (Admin). */
const DEMO_ACCOUNT: AuthAccount = {
  username: 'demo',
  password: 'demo',
  fullName: 'Demo Admin',
  email: 'demo@greenmeadows.in',
  role: 'admin'
};

/**
 * Dummy client-side authentication. Swap `login()` / `register()` bodies with
 * real REST calls (see `API_ENDPOINTS`) without changing any consumers.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly state = inject(SocietyStateService);

  readonly session = signal<AuthSession | null>(this.readSession());
  readonly isAuthenticated = computed(() => this.session() !== null);

  constructor() {
    const s = this.session();
    if (s) {
      this.applyRole(s.role);
    }
  }

  login(username: string, password: string): AuthResult {
    const name = username.trim().toLowerCase();
    const asMobile = normalizeMobile(username);
    if (!name || !password) {
      return { ok: false, error: 'Enter both username and password.' };
    }

    const account = [DEMO_ACCOUNT, ...this.readAccounts()].find(
      a => (a.username.toLowerCase() === name || a.email.toLowerCase() === name || (!!a.mobile && MOBILE_RE.test(asMobile) && a.mobile === asMobile)) && !!a.password && a.password === password
    );
    if (!account) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    this.startSession(account);
    return { ok: true };
  }

  /**
   * Social sign-in (Gmail / Facebook).
   * - Live backend: redirects the browser to the server OAuth endpoint (`/auth/oauth/<provider>`),
   *   which returns to the app with a session token.
   * - Mock mode: simulates the provider consent screen using the email the user typed,
   *   then signs in (or creates) a resident account linked to that email.
   */
  loginWithProvider(provider: SocialProvider, email: string): AuthResult {
    if (!environment.useMockApi) {
      window.location.href = `${environment.apiBaseUrl}/auth/oauth/${provider}`;
      return { ok: true };
    }
    const mail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) {
      return { ok: false, error: 'Enter a valid email address to continue.' };
    }
    if (provider === 'google' && !/@(gmail|googlemail)\.com$/.test(mail)) {
      return { ok: false, error: 'Please use your Gmail address (name@gmail.com).' };
    }

    const accounts = this.readAccounts();
    let account = accounts.find(a => a.email.toLowerCase() === mail);
    if (!account) {
      account = {
        username: mail,
        password: '',
        fullName: mail.split('@')[0],
        email: mail,
        role: 'member',
        provider
      };
      this.writeAccounts([...accounts, account]);
    }
    this.startSession(account);
    return { ok: true };
  }

  /** Forgot-password step 1: look up the account and return its hint question. */
  getHintQuestion(identifier: string): AuthResult {
    const account = this.findByIdentifier(identifier);
    if (!account) {
      return { ok: false, error: 'No account found with that username or email.' };
    }
    if (account.provider) {
      return { ok: false, error: `This account signs in with ${account.provider === 'google' ? 'Google' : 'Facebook'}. No password to reset.` };
    }
    if (!account.hintQuestion) {
      return { ok: false, error: 'No hint question is set for this account. Contact your society admin.' };
    }
    return { ok: true, question: account.hintQuestion };
  }

  /** Forgot-password step 2: verify the hint answer and set the new password. */
  resetPassword(identifier: string, answer: string, newPassword: string): AuthResult {
    const account = this.findByIdentifier(identifier);
    if (!account || !account.hintAnswer) {
      return { ok: false, error: 'Account not found.' };
    }
    if (normalizeAnswer(answer) !== account.hintAnswer) {
      return { ok: false, error: 'Hint answer is incorrect.' };
    }
    const policyError = validatePassword(newPassword, [account.fullName, account.email, account.mobile ?? '']);
    if (policyError) {
      return { ok: false, error: policyError };
    }
    this.writeAccounts(
      this.readAccounts().map(a => (a.username === account.username ? { ...a, password: newPassword } : a))
    );
    return { ok: true };
  }

  /**
   * Registration. The user picks whether their login id (username) is their email or mobile.
   * The other value is still stored and can also be used to sign in / reset the password.
   */
  register(data: {
    firstName: string;
      lastName: string;
    mobile: string;
    email: string;
    loginWith: 'email' | 'mobile';
    password: string;
    hintQuestion: string;
    hintAnswer: string;
  }): AuthResult {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();
    const mobile = normalizeMobile(data.mobile);

    if (!firstName || !lastName) {
      return { ok: false, error: 'First name and last name are required.' };
    }
    if (!MOBILE_RE.test(mobile)) {
      return { ok: false, error: 'Enter a valid 10-digit mobile number.' };
    }
    if (!EMAIL_RE.test(email)) {
      return { ok: false, error: 'Enter a valid email address.' };
    }
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const policyError = validatePassword(data.password, [firstName, lastName, email.split('@')[0], mobile]);
    if (policyError) {
      return { ok: false, error: policyError };
    }
    if (!data.hintQuestion || !data.hintAnswer.trim()) {
      return { ok: false, error: 'Choose a hint question and provide an answer.' };
    }

    // Username = whichever identifier the user chose to sign in with
    const username = data.loginWith === 'email' ? email : mobile;
    const existing = [DEMO_ACCOUNT, ...this.readAccounts()];
    if (existing.some(a => a.username.toLowerCase() === username || a.email.toLowerCase() === email || (!!a.mobile && a.mobile === mobile))) {
      return { ok: false, error: 'An account with this email or mobile already exists.' };
    }

    const account: AuthAccount = {
      username,
      password: data.password,
      fullName,
      firstName,
      lastName,
      email,
      mobile,
      role: 'member',
      hintQuestion: data.hintQuestion,
      hintAnswer: normalizeAnswer(data.hintAnswer)
    };
    this.writeAccounts([...this.readAccounts(), account]);
    return this.login(username, data.password);
  }

  /** Creates + persists the session for an account (shared by password and social login). */
  private startSession(account: AuthAccount): void {
    const session: AuthSession = {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      role: account.role
    };
    this.session.set(session);
    this.persistSession(session);
    this.applyRole(session.role);
  }

  private findByIdentifier(identifier: string): AuthAccount | undefined {
    const key = identifier.trim().toLowerCase();
    if (!key) return undefined;
    const mobile = normalizeMobile(identifier);
    return this.readAccounts().find(
      a =>
        a.username.toLowerCase() === key ||
        a.email.toLowerCase() === key ||
        (!!a.mobile && MOBILE_RE.test(mobile) && a.mobile === mobile)
    );
  }

  logout(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.router.navigate(['/login']);
  }

  private applyRole(role: UserRole): void {
    this.state.currentUserRole.set(role);
    document.body.setAttribute('data-role', role);
  }

  private readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }

  private readAccounts(): AuthAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      return raw ? (JSON.parse(raw) as AuthAccount[]) : [];
    } catch {
      return [];
    }
  }

  private writeAccounts(list: AuthAccount[]): void {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
}

