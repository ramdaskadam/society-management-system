import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../../models/society.model';
import { SocietyStateService } from '../../services/society-state.service';

export interface AuthAccount {
  username: string;
  /** DEMO ONLY: stored in plain text in localStorage. Replace with a real identity provider (OIDC/JWT) in production. */
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
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
}

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
    if (!name || !password) {
      return { ok: false, error: 'Enter both username and password.' };
    }

    const account = [DEMO_ACCOUNT, ...this.readAccounts()].find(
      a => a.username.toLowerCase() === name && a.password === password
    );
    if (!account) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    const session: AuthSession = {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      role: account.role
    };
    this.session.set(session);
    this.persistSession(session);
    this.applyRole(session.role);
    return { ok: true };
  }

  register(data: { fullName: string; email: string; username: string; password: string }): AuthResult {
    const username = data.username.trim();
    const key = username.toLowerCase();

    if (!data.fullName.trim() || !username || !data.email.trim() || !data.password) {
      return { ok: false, error: 'All fields are required.' };
    }
    if (data.password.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' };
    }
    const taken = [DEMO_ACCOUNT, ...this.readAccounts()].some(a => a.username.toLowerCase() === key);
    if (taken) {
      return { ok: false, error: 'That username is already taken.' };
    }

    const account: AuthAccount = {
      username,
      password: data.password,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      role: 'member'
    };
    this.writeAccounts([...this.readAccounts(), account]);
    return this.login(username, data.password);
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

