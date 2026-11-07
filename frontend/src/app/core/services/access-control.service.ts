import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SocietyStateService } from '../../services/society-state.service';

export type AccessAction = 'read' | 'write' | 'execute';

export interface AccessFlags {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface AccessModule {
  id: string;
  label: string;
  description: string;
}

/** Modules whose access an admin can grant/revoke per resident. */
export const ACCESS_MODULES: AccessModule[] = [
  { id: 'units', label: 'Units', description: 'View unit & apartment records' },
  { id: 'payments', label: 'Invoices & Payments', description: 'View bills · Execute: pay dues' },
  { id: 'complaints', label: 'Complaints', description: 'View tickets · Write: raise tickets' },
  { id: 'visitors', label: 'Visitors & Gate', description: 'View logs · Execute: pre-approve OTP' },
  { id: 'parking', label: 'Parking & EV', description: 'View bays · Write: register vehicle' },
  { id: 'polls', label: 'Polls & Voting', description: 'View polls · Execute: cast vote' },
  { id: 'notices', label: 'Notices', description: 'View society notices' },
  { id: 'amenities', label: 'Amenities', description: 'View amenities · Execute: book' },
  { id: 'documents', label: 'Documents', description: 'View society documents' }
];

export const ACCESS_ACTIONS: { id: AccessAction; label: string; hint: string }[] = [
  { id: 'read', label: 'Read', hint: 'View the module' },
  { id: 'write', label: 'Write', hint: 'Create or edit records' },
  { id: 'execute', label: 'Execute', hint: 'Run actions (pay, book, approve)' }
];

/** Route / nav view id → access module id. */
export const VIEW_TO_MODULE: Record<string, string> = {
  units: 'units',
  'my-unit': 'units',
  tenants: 'tenants',
  maintenance: 'payments',
  payments: 'payments',
  complaints: 'complaints',
  visitors: 'visitors',
  parking: 'parking',
  polls: 'polls',
  notices: 'notices',
  amenities: 'amenities',
  documents: 'documents'
};

const STORAGE_KEY = 'sms_access_grants_v1';

type GrantMap = Record<string, Record<string, AccessFlags>>;

/** Default permissions for a resident before an admin customises anything. */
function defaultFlags(moduleId: string): AccessFlags {
  const writeDefaults = ['complaints', 'parking', 'amenities'];
  const executeDefaults = ['payments', 'visitors', 'polls', 'amenities'];
  return {
    read: true,
    write: writeDefaults.includes(moduleId),
    execute: executeDefaults.includes(moduleId)
  };
}

/**
 * Admin-managed Read / Write / Execute access per resident and module.
 * Admins always have full access. Persisted in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly state = inject(SocietyStateService);

  readonly modules = ACCESS_MODULES;
  readonly actions = ACCESS_ACTIONS;
  readonly grants = signal<GrantMap>(this.load());

  /** Member id of the resident currently using the Member Portal. */
  readonly activeMemberId = computed(() => {
    const unit = this.state.memberUser().unit;
    return this.state.members().find(m => m.unit === unit)?.id ?? 'self';
  });

  constructor() {
    effect(() => {
      const value = this.grants();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    });
  }

  flags(memberId: string, moduleId: string): AccessFlags {
    return this.grants()[memberId]?.[moduleId] ?? defaultFlags(moduleId);
  }

  /** Permission check for the signed-in user. Admins are always allowed. */
  can(moduleId: string, action: AccessAction): boolean {
    if (this.state.currentUserRole() === 'admin') return true;
    // Approved Tenants have limited portal access compared to Flat Owners / Primary Members:
    //  - Cannot access Tenants & Lease management ('tenants')
    //  - Cannot access or vote in Society Governance Polls ('polls')
    //  - Cannot modify Units ('units' write) or allocate Parking Bays ('parking' write)
    if (this.state.isTenantSession()) {
      if (moduleId === 'tenants' || moduleId === 'polls') return false;
      if ((moduleId === 'units' || moduleId === 'parking') && action !== 'read') return false;
    }
    if (moduleId === 'tenants') return true;
    return this.flags(this.activeMemberId(), moduleId)[action];
  }

  /** Like `can()` but shows a toast when denied. */
  require(moduleId: string, action: AccessAction): boolean {
    const allowed = this.can(moduleId, action);
    if (!allowed) {
      this.state.showToast('msg.noAccess', 'warning', { action });
    }
    return allowed;
  }

  set(memberId: string, moduleId: string, action: AccessAction, value: boolean, audit = true): void {
    this.grants.update(map => {
      const current = map[memberId]?.[moduleId] ?? defaultFlags(moduleId);
      return {
        ...map,
        [memberId]: { ...map[memberId], [moduleId]: { ...current, [action]: value } }
      };
    });
    if (audit) {
      this.audit(memberId, `${value ? 'Granted' : 'Revoked'} ${action} access on "${moduleId}" for ${memberId}.`);
    }
  }

  /** Grant/revoke one action across every module for a resident. */
  setColumn(memberId: string, action: AccessAction, value: boolean): void {
    this.modules.forEach(m => this.set(memberId, m.id, action, value, false));
    this.audit(memberId, `${value ? 'Granted' : 'Revoked'} ${action} access on all modules for ${memberId}.`);
  }

  /** Grant/revoke every action on one module for a resident. */
  setRow(memberId: string, moduleId: string, value: boolean): void {
    this.actions.forEach(a => this.set(memberId, moduleId, a.id, value, false));
    this.audit(memberId, `${value ? 'Granted' : 'Revoked'} full access on "${moduleId}" for ${memberId}.`);
  }

  setAll(memberId: string, value: boolean): void {
    this.modules.forEach(m => this.actions.forEach(a => this.set(memberId, m.id, a.id, value, false)));
    this.audit(memberId, `${value ? 'Granted' : 'Revoked'} all access for ${memberId}.`);
  }

  resetMember(memberId: string): void {
    this.grants.update(map => {
      const { [memberId]: _removed, ...rest } = map;
      return rest;
    });
    this.audit(memberId, `Reset access to defaults for ${memberId}.`);
  }

  countGranted(memberId: string): number {
    let n = 0;
    this.modules.forEach(m => this.actions.forEach(a => (this.flags(memberId, m.id)[a.id] ? n++ : 0)));
    return n;
  }

  private audit(memberId: string, details: string): void {
    this.state.logAudit('Security', details, 'Access control updated');
    this.state.showToast(details, 'info');
  }

  private load(): GrantMap {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as GrantMap) : {};
    } catch {
      return {};
    }
  }
}

