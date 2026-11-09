import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SocietyStateService } from '../../services/society-state.service';
import governanceSeed from '../../../assets/mock-data/governance.json';

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

/** Modules whose access an admin can grant/revoke per resident (loaded from `governance.json`). */
export const ACCESS_MODULES: AccessModule[] = governanceSeed.accessModules as AccessModule[];

export const ACCESS_ACTIONS: { id: AccessAction; label: string; hint: string }[] =
  governanceSeed.accessActions as { id: AccessAction; label: string; hint: string }[];

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

/** Default permissions for a resident before an admin customises anything (loaded from `governance.json`). */
function defaultFlags(moduleId: string): AccessFlags {
  const writeDefaults: string[] = governanceSeed.defaultWriteModules;
  const executeDefaults: string[] = governanceSeed.defaultExecuteModules;
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
  /** Persisted permission grants (used by route guards and runtime `can()` checks). */
  readonly grants = signal<GrantMap>(this.load());
  /** Staged permission grants edited in the Access Control view before clicking Save. */
  readonly draftGrants = signal<GrantMap>(this.cloneMap(this.grants()));

  /** True when the admin has modified permissions in the Access Control matrix that are not yet saved. */
  readonly hasUnsavedChanges = computed(
    () => JSON.stringify(this.grants()) !== JSON.stringify(this.draftGrants())
  );

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

  /** Returns staged flags for display/editing in the Access Control matrix. */
  flags(memberId: string, moduleId: string): AccessFlags {
    return this.draftGrants()[memberId]?.[moduleId] ?? defaultFlags(moduleId);
  }

  /** Returns persisted flags for live permission enforcement. */
  persistedFlags(memberId: string, moduleId: string): AccessFlags {
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
    return this.persistedFlags(this.activeMemberId(), moduleId)[action];
  }

  /** Like `can()` but shows a toast when denied. */
  require(moduleId: string, action: AccessAction): boolean {
    const allowed = this.can(moduleId, action);
    if (!allowed) {
      this.state.showToast('msg.noAccess', 'warning', { action });
    }
    return allowed;
  }

  set(memberId: string, moduleId: string, action: AccessAction, value: boolean): void {
    this.draftGrants.update(map => {
      const current = map[memberId]?.[moduleId] ?? defaultFlags(moduleId);
      return {
        ...map,
        [memberId]: { ...map[memberId], [moduleId]: { ...current, [action]: value } }
      };
    });
  }

  /** Grant/revoke one action across every module for a resident (staged until Save). */
  setColumn(memberId: string, action: AccessAction, value: boolean): void {
    this.modules.forEach(m => this.set(memberId, m.id, action, value));
  }

  /** Grant/revoke every action on one module for a resident (staged until Save). */
  setRow(memberId: string, moduleId: string, value: boolean): void {
    this.actions.forEach(a => this.set(memberId, moduleId, a.id, value));
  }

  setAll(memberId: string, value: boolean): void {
    this.modules.forEach(m => this.actions.forEach(a => this.set(memberId, m.id, a.id, value)));
  }

  resetMember(memberId: string): void {
    this.draftGrants.update(map => {
      const { [memberId]: _removed, ...rest } = map;
      return rest;
    });
  }

  /** Persists staged `draftGrants` into live `grants` and localStorage, logging an audit entry. */
  saveChanges(targetSummary?: string): void {
    const committed = this.cloneMap(this.draftGrants());
    this.grants.set(committed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(committed));
    } catch {
      /* ignore */
    }
    const details = targetSummary
      ? `Saved access control permissions for ${targetSummary}.`
      : 'Saved access control permission matrix changes.';
    this.state.logAudit('Security', details, 'Access control updated');
    this.state.showToast(details, 'success');
  }

  /** Discards unsaved staged changes and restores `draftGrants` from persisted `grants`. */
  discardChanges(): void {
    this.draftGrants.set(this.cloneMap(this.grants()));
    this.state.showToast('Discarded unsaved access control changes.', 'info');
  }

  countGranted(memberId: string): number {
    let n = 0;
    this.modules.forEach(m => this.actions.forEach(a => (this.flags(memberId, m.id)[a.id] ? n++ : 0)));
    return n;
  }

  private cloneMap(map: GrantMap): GrantMap {
    return JSON.parse(JSON.stringify(map || {})) as GrantMap;
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

