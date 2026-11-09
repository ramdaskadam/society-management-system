import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../../models/society.model';
import { SocietyStateService } from '../../services/society-state.service';
import { environment } from '../../../environments/environment';
import { validatePassword } from '../utils/password-policy';
import governanceSeed from '../../../assets/mock-data/governance.json';

/** Security questions offered at registration (loaded from `governance.json`). */
export const HINT_QUESTIONS: readonly string[] = governanceSeed.hintQuestions;

export type SocialProvider = 'google' | 'facebook';
export type AccountType = 'admin' | 'member' | 'tenant';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

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
  /** Distinguishes a Primary Member / Flat Owner ('member') from a Registered Tenant ('tenant'). */
  accountType?: AccountType;
  /** Flat / Unit number associated with the registration (e.g. 'A-101', 'B-204'). */
  unitNo?: string;
  /** Approval gate: new members require Admin approval; new tenants require Flat Owner approval. */
  approvalStatus?: ApprovalStatus;
  registeredOn?: string;
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
  accountType?: AccountType;
  unitNo?: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** True when registration succeeded and is awaiting Admin or Member approval. */
  pendingApproval?: boolean;
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

/** Built-in dummy account loaded from `governance.json`. */
const DEMO_ACCOUNT: AuthAccount = governanceSeed.demoAccount as AuthAccount;

/**
 * Seeded registrations loaded from `governance.json` so the Admin (for new Members)
 * and the Flat Owner (for new Tenants) can immediately test searching, confirming, and approving registrations.
 */
const DEFAULT_SEEDED_ACCOUNTS: AuthAccount[] = governanceSeed.seededAccounts as AuthAccount[];

/**
 * Authentication & Registration Approval Service.
 * - New Member registrations require Society Admin approval before login is allowed.
 * - New Tenant registrations can be pulled by the Flat Owner (using First Name, Last Name,
 *   Mobile Number, or Email Address) and approved before the tenant can log in with limited access.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly state = inject(SocietyStateService);

  readonly accounts = signal<AuthAccount[]>(this.initAccounts());
  readonly session = signal<AuthSession | null>(this.readSession());
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Newly registered Flat Owners / Members awaiting Admin confirmation & approval. */
  readonly pendingMemberAccounts = computed(() =>
    this.accounts().filter(
      a => (a.accountType ?? 'member') === 'member' && a.approvalStatus === 'Pending'
    )
  );

  /** All registered Tenant accounts (Pending or Approved). */
  readonly registeredTenantAccounts = computed(() =>
    this.accounts().filter(a => a.accountType === 'tenant')
  );

  constructor() {
    const s = this.session();
    if (s) {
      this.state.isTenantSession.set(s.accountType === 'tenant');
      this.applyRole(s.role);
    }
  }

  login(username: string, password: string): AuthResult {
    const name = username.trim().toLowerCase();
    const asMobile = normalizeMobile(username);
    if (!name || !password) {
      return { ok: false, error: 'Enter both username and password.' };
    }

    const account = [DEMO_ACCOUNT, ...this.accounts()].find(
      a =>
        (a.username.toLowerCase() === name ||
          a.email.toLowerCase() === name ||
          (!!a.mobile && MOBILE_RE.test(asMobile) && a.mobile === asMobile)) &&
        !!a.password &&
        a.password === password
    );
    if (!account) {
      return { ok: false, error: 'Invalid username or password.' };
    }

    const gateError = this.checkApprovalGate(account);
    if (gateError) {
      return { ok: false, error: gateError };
    }

    this.startSession(account);
    return { ok: true };
  }

  /**
   * Social sign-in (Gmail / Facebook).
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

    const list = this.accounts();
    const account = list.find(a => a.email.toLowerCase() === mail);
    if (!account) {
      const pending: AuthAccount = {
        username: mail,
        password: '',
        fullName: mail.split('@')[0],
        firstName: mail.split('@')[0],
        lastName: '',
        email: mail,
        role: 'member',
        accountType: 'member',
        unitNo: 'A-101',
        approvalStatus: 'Pending',
        registeredOn: 'Today',
        provider
      };
      this.saveAccounts([...list, pending]);
      return {
        ok: false,
        error: 'Account registered and awaiting Society Admin approval before you can sign in.'
      };
    }

    const gateError = this.checkApprovalGate(account);
    if (gateError) {
      return { ok: false, error: gateError };
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
      return {
        ok: false,
        error: `This account signs in with ${account.provider === 'google' ? 'Google' : 'Facebook'}. No password to reset.`
      };
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
    this.saveAccounts(
      this.accounts().map(a => (a.username === account.username ? { ...a, password: newPassword } : a))
    );
    return { ok: true };
  }

  /**
   * Registration.
   * New Member accounts require Admin approval; new Tenant accounts require Flat Owner approval.
   */
  register(data: {
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    loginWith: 'email' | 'mobile';
    accountType?: 'member' | 'tenant';
    unitNo?: string;
    password: string;
    hintQuestion: string;
    hintAnswer: string;
  }): AuthResult {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();
    const mobile = normalizeMobile(data.mobile);
    const accountType: AccountType = data.accountType === 'tenant' ? 'tenant' : 'member';
    const unitNo = (data.unitNo ?? 'A-101').trim().toUpperCase() || 'A-101';

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

    const username = data.loginWith === 'email' ? email : mobile;
    const existing = [DEMO_ACCOUNT, ...this.accounts()];
    if (
      existing.some(
        a =>
          a.username.toLowerCase() === username ||
          a.email.toLowerCase() === email ||
          (!!a.mobile && a.mobile === mobile)
      )
    ) {
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
      accountType,
      unitNo,
      approvalStatus: 'Pending',
      registeredOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      hintQuestion: data.hintQuestion,
      hintAnswer: normalizeAnswer(data.hintAnswer)
    };
    this.saveAccounts([account, ...this.accounts()]);
    this.state.showToast(
      accountType === 'tenant' ? 'msg.regSubmittedTenant' : 'msg.regSubmittedMember',
      'info'
    );
    return { ok: true, pendingApproval: true };
  }

  /**
   * Admin confirms and approves a newly registered Member.
   * Once approved, the member is added to the society directory and can sign in to the Member Portal.
   */
  approveMemberAccount(username: string): void {
    const target = this.accounts().find(a => a.username === username);
    if (!target) return;

    this.saveAccounts(
      this.accounts().map(a => (a.username === username ? { ...a, approvalStatus: 'Approved' } : a))
    );

    const unit = target.unitNo || 'A-101';
    const alreadyInDirectory = this.state
      .members()
      .some(m => m.email.toLowerCase() === target.email.toLowerCase());
    if (!alreadyInDirectory) {
      this.state.addMember({
        name: target.fullName,
        unit,
        role: 'Owner',
        email: target.email,
        phone: target.mobile || ''
      });
    }
    this.state.logAudit('Security', `Admin approved member registration for ${target.fullName} (${unit}).`);
    this.state.showToast('msg.memberApproved', 'success', { name: target.fullName, unit });
  }

  /**
   * Member pulls registered tenant info using Last Name, First Name, Mobile Number, or Email Address.
   */
  searchRegisteredTenants(query: string, flatUnit?: string): AuthAccount[] {
    const q = query.trim().toLowerCase();
    const digits = normalizeMobile(query);
    const list = this.registeredTenantAccounts().filter(a => a.approvalStatus !== 'Rejected');

    if (!q) {
      // When no search query is typed, show pending tenant requests for this flat
      return flatUnit
        ? list.filter(a => !a.unitNo || a.unitNo.toUpperCase() === flatUnit.toUpperCase())
        : list;
    }

    return list.filter(a => {
      const first = (a.firstName ?? a.fullName.split(' ')[0] ?? '').toLowerCase();
      const last = (a.lastName ?? a.fullName.split(' ').slice(1).join(' ') ?? '').toLowerCase();
      const full = a.fullName.toLowerCase();
      const mail = a.email.toLowerCase();
      const mob = a.mobile ?? '';
      return (
        first.includes(q) ||
        last.includes(q) ||
        full.includes(q) ||
        mail.includes(q) ||
        (digits.length >= 3 && mob.includes(digits))
      );
    });
  }

  /**
   * Primary Member confirms and approves a registered Tenant for their flat.
   * Once approved, the tenant can log in with limited tenant access and appears in the flat's Active Tenants.
   */
  approveTenantAccount(username: string, unitNo: string): void {
    const target = this.accounts().find(a => a.username === username);
    if (!target) return;

    this.saveAccounts(
      this.accounts().map(a =>
        a.username === username ? { ...a, approvalStatus: 'Approved', unitNo } : a
      )
    );

    // Ensure the approved tenant is also listed in the flat's active tenants
    const alreadyTenant = this.state
      .tenants()
      .some(t => t.unitNo === unitNo && t.email?.toLowerCase() === target.email.toLowerCase() && t.status === 'Active');

    if (!alreadyTenant) {
      const todayIso = new Date().toISOString().slice(0, 10);
      const nextYearIso = `${new Date().getFullYear() + 1}-${todayIso.slice(5)}`;
      this.state.addTenant(
        {
          firstName: target.firstName || target.fullName.split(' ')[0] || target.fullName,
          middleName: '',
          lastName: target.lastName || target.fullName.split(' ').slice(1).join(' ') || '',
          dob: '1992-01-01',
          gender: 'Other',
          qualification: '',
          mobile: target.mobile || '',
          email: target.email,
          hasDisability: false,
          disabilityDetails: ''
        },
        {
          leaseStart: todayIso,
          leaseEnd: nextYearIso,
          policeVerified: true,
          status: 'Active'
        }
      );
    }

    this.state.logAudit('Security', `Member approved tenant ${target.fullName} for Flat ${unitNo}.`);
    this.state.showToast('msg.tenantApproved', 'success', { name: target.fullName, unit: unitNo });
  }

  /** Admin or Member declines a pending registration request. */
  rejectAccount(username: string): void {
    const target = this.accounts().find(a => a.username === username);
    if (!target) return;
    this.saveAccounts(
      this.accounts().map(a => (a.username === username ? { ...a, approvalStatus: 'Rejected' } : a))
    );
    this.state.logAudit('Security', `Declined registration request for ${target.fullName}.`);
    this.state.showToast('msg.accountRejected', 'warning', { name: target.fullName });
  }

  private checkApprovalGate(account: AuthAccount): string | null {
    if (account.approvalStatus === 'Pending') {
      return account.accountType === 'tenant'
        ? `Your tenant account is pending approval from the Flat Owner (${account.unitNo || 'your unit'}).`
        : 'Your member registration is pending confirmation and approval by the Society Admin.';
    }
    if (account.approvalStatus === 'Rejected') {
      return 'Your registration request was declined. Please contact the society office.';
    }
    return null;
  }

  /** Creates + persists the session for an account (shared by password and social login). */
  private startSession(account: AuthAccount): void {
    const accountType: AccountType = account.accountType ?? (account.role === 'admin' ? 'admin' : 'member');
    const session: AuthSession = {
      username: account.username,
      fullName: account.fullName,
      email: account.email,
      role: account.role,
      accountType,
      unitNo: account.unitNo
    };
    this.session.set(session);
    this.persistSession(session);
    this.state.isTenantSession.set(accountType === 'tenant');

    if (account.role === 'member') {
      this.state.memberUser.update(u => ({
        ...u,
        name: account.fullName || u.name,
        email: account.email || u.email,
        phone: account.mobile || u.phone,
        unit: account.unitNo || u.unit,
        role: accountType === 'tenant' ? 'Registered Tenant (Limited Access)' : 'Flat Owner'
      }));
    }
    this.applyRole(session.role);
  }

  private findByIdentifier(identifier: string): AuthAccount | undefined {
    const key = identifier.trim().toLowerCase();
    if (!key) return undefined;
    const mobile = normalizeMobile(identifier);
    return this.accounts().find(
      a =>
        a.username.toLowerCase() === key ||
        a.email.toLowerCase() === key ||
        (!!a.mobile && MOBILE_RE.test(mobile) && a.mobile === mobile)
    );
  }

  logout(): void {
    this.session.set(null);
    this.state.isTenantSession.set(false);
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

  private initAccounts(): AuthAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_SEEDED_ACCOUNTS));
        return DEFAULT_SEEDED_ACCOUNTS;
      }
      const parsed = JSON.parse(raw) as AuthAccount[];
      // Merge any missing seeded demo accounts so pending approvals are always testable
      const existingEmails = new Set(parsed.map(a => a.email.toLowerCase()));
      const merged = [
        ...parsed,
        ...DEFAULT_SEEDED_ACCOUNTS.filter(d => !existingEmails.has(d.email.toLowerCase()))
      ];
      return merged;
    } catch {
      return DEFAULT_SEEDED_ACCOUNTS;
    }
  }

  private saveAccounts(list: AuthAccount[]): void {
    this.accounts.set(list);
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
}
