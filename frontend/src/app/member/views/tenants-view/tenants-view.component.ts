import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { FamilyMember, PersonDetails, TenantRecord } from '../../../models/society.model';
import {
  PersonDialogComponent,
  PersonDialogData,
  PersonFormResult
} from '../../../shared/dialogs/person-dialog/person-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';
import { AuthAccount, AuthService } from '../../../core/services/auth.service';

interface PendingConfirmAction {
  type: 'delete-tenant' | 'delete-family' | 'end-lease' | 'approve-reg-tenant' | 'reject-reg-tenant';
  tenant?: TenantRecord;
  family?: FamilyMember;
  regAccount?: AuthAccount;
}

/**
 * Tenants & Sub-Tenants Management View.
 * - Shows Active Tenants by default whenever present.
 * - Allows the Member (Flat Owner) to pull registered tenant info by First Name, Last Name,
 *   Mobile Number, or Email Address and approve them for their flat (granting limited tenant login access).
 * - Shows "+ Add Tenant" before "Tenant History" (which is only visible when pastTenants().length > 0).
 * - Past tenant history (both primary tenant and secondary family members) is strictly read-only.
 * - Uses the reusable <app-confirm-dialog> modal for Approve / Remove / Move Out actions.
 */
@Component({
  selector: 'app-tenants-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PersonDialogComponent, ConfirmDialogComponent, TranslatePipe],
  templateUrl: './tenants-view.component.html'
})
export class TenantsViewComponent {
  readonly state = inject(SocietyStateService);
  readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  /** Always defaults to false so Active Tenants are shown by default. */
  readonly showHistory = signal(false);

  /** Search query to pull registered tenant accounts by First Name, Last Name, Mobile Number, or Email. */
  readonly tenantLookupQuery = signal('');

  /** Registered tenant accounts matching the lookup query (or pending requests for this flat). */
  readonly pulledTenantAccounts = computed(() =>
    this.auth.searchRegisteredTenants(this.tenantLookupQuery(), this.state.currentResidentUnit())
  );

  /** Active tenants currently residing in the flat. */
  readonly activeTenants = computed(() =>
    this.state.activeUnitTenants().filter(t => t.status === 'Active')
  );

  /** Past tenants for the same flat (sorted by leaseEnd descending). */
  readonly pastTenants = computed(() =>
    [...this.state.activeUnitTenants().filter(t => t.status === 'Past')].sort((a, b) =>
      b.leaseEnd.localeCompare(a.leaseEnd)
    )
  );

  /** Automatically exit history mode if there are no past tenants. */
  private readonly autoCloseEmptyHistory = effect(
    () => {
      if (this.showHistory() && this.pastTenants().length === 0) {
        this.showHistory.set(false);
      }
    },
    { allowSignalWrites: true }
  );

  /** Which dialog mode is open: 'none' | 'tenant' | 'family'. */
  readonly dialogMode = signal<'none' | 'tenant' | 'family'>('none');
  /** Tenant being edited (when dialogMode === 'tenant'), or parent tenant when adding/editing a family member. */
  readonly activeTenant = signal<TenantRecord | null>(null);
  /** Family member of `activeTenant` being edited (null = adding new family member). */
  readonly editingFamily = signal<FamilyMember | null>(null);

  /** Modal confirmation state for Approve / Remove / End Lease. */
  readonly pendingConfirm = signal<PendingConfirmAction | null>(null);

  readonly confirmTitle = computed(() => {
    const p = this.pendingConfirm();
    if (!p) return '';
    if (p.type === 'approve-reg-tenant') return this.i18n.translate('approval.approveTenantConfirmTitle');
    if (p.type === 'reject-reg-tenant') return this.i18n.translate('approval.rejectBtn');
    if (p.type === 'delete-tenant') return this.i18n.translate('confirm.removeTenantTitle');
    if (p.type === 'delete-family') return this.i18n.translate('confirm.removeFamilyTitle');
    return this.i18n.translate('confirm.endLeaseTitle');
  });

  readonly confirmMessage = computed(() => {
    const p = this.pendingConfirm();
    if (!p) return '';
    const unit = this.state.currentResidentUnit();
    if (p.type === 'approve-reg-tenant' && p.regAccount) {
      return this.i18n.translate('approval.approveTenantConfirmMsg', { name: p.regAccount.fullName, unit });
    }
    if (p.type === 'reject-reg-tenant' && p.regAccount) {
      return `Decline tenant registration request from ${p.regAccount.fullName}?`;
    }
    if (p.type === 'delete-tenant' && p.tenant) {
      return this.i18n.translate('confirm.removeTenantMsg', { name: this.fullName(p.tenant) });
    }
    if (p.type === 'delete-family' && p.family) {
      return this.i18n.translate('confirm.removeFamilyMsg', { name: this.fullName(p.family) });
    }
    if (p.tenant) {
      return this.i18n.translate('confirm.endLeaseMsg', { name: this.fullName(p.tenant) });
    }
    return '';
  });

  readonly confirmButtonText = computed(() => {
    const p = this.pendingConfirm();
    if (!p) return '';
    if (p.type === 'approve-reg-tenant') return this.i18n.translate('approval.approveTenantBtn');
    if (p.type === 'reject-reg-tenant') return this.i18n.translate('approval.rejectBtn');
    if (p.type === 'end-lease') return this.i18n.translate('confirm.yesEndLease');
    return this.i18n.translate('confirm.yesRemove');
  });

  readonly confirmVariant = computed<'danger' | 'primary'>(() => {
    const t = this.pendingConfirm()?.type;
    return t === 'end-lease' || t === 'approve-reg-tenant' ? 'primary' : 'danger';
  });

  readonly dialogTitle = computed(() => {
    if (this.dialogMode() === 'tenant') {
      return this.activeTenant()
        ? this.i18n.translate('tenant.editTenant')
        : this.i18n.translate('tenant.addTenant');
    }
    return this.editingFamily()
      ? this.i18n.translate('profile.editFamilyMember')
      : this.i18n.translate('profile.addFamilyMember');
  });

  readonly dialogPerson = computed<PersonDialogData | null>(() => {
    if (this.dialogMode() === 'tenant') {
      return this.activeTenant();
    }
    return this.editingFamily();
  });

  toggleHistory(): void {
    this.showHistory.update(v => !v);
  }

  clearLookup(): void {
    this.tenantLookupQuery.set('');
  }

  askApproveRegTenant(regAccount: AuthAccount): void {
    this.pendingConfirm.set({ type: 'approve-reg-tenant', regAccount });
  }

  askRejectRegTenant(regAccount: AuthAccount): void {
    this.pendingConfirm.set({ type: 'reject-reg-tenant', regAccount });
  }

  openAddTenant(): void {
    this.activeTenant.set(null);
    this.editingFamily.set(null);
    this.dialogMode.set('tenant');
  }

  openEditTenant(t: TenantRecord): void {
    if (t.status === 'Past') return; // Past tenant records are read-only
    this.activeTenant.set(t);
    this.editingFamily.set(null);
    this.dialogMode.set('tenant');
  }

  openAddFamily(t: TenantRecord): void {
    if (t.status === 'Past') return; // Past tenant records are read-only
    this.activeTenant.set(t);
    this.editingFamily.set(null);
    this.dialogMode.set('family');
  }

  openEditFamily(t: TenantRecord, f: FamilyMember): void {
    if (t.status === 'Past') return; // Past tenant records are read-only
    this.activeTenant.set(t);
    this.editingFamily.set(f);
    this.dialogMode.set('family');
  }

  closeDialog(): void {
    this.dialogMode.set('none');
    this.activeTenant.set(null);
    this.editingFamily.set(null);
  }

  onSave(res: PersonFormResult): void {
    if (this.dialogMode() === 'tenant' && res.lease) {
      const existing = this.activeTenant();
      if (existing) {
        if (existing.status === 'Past') return;
        this.state.updateTenant(existing.id, res.details, res.lease);
      } else {
        this.state.addTenant(res.details, res.lease);
        this.showHistory.set(false);
      }
    } else if (this.dialogMode() === 'family') {
      const tenant = this.activeTenant();
      if (tenant && tenant.status === 'Active') {
        const fam = this.editingFamily();
        if (fam) {
          this.state.updateTenantFamilyMember(tenant.id, fam.id, res.details, res.relation);
        } else {
          this.state.addTenantFamilyMember(tenant.id, res.details, res.relation);
        }
      }
    }
    this.closeDialog();
  }

  askEndLease(tenant: TenantRecord): void {
    this.pendingConfirm.set({ type: 'end-lease', tenant });
  }

  askDeleteTenant(tenant: TenantRecord): void {
    this.pendingConfirm.set({ type: 'delete-tenant', tenant });
  }

  askDeleteFamily(tenant: TenantRecord, family: FamilyMember): void {
    this.pendingConfirm.set({ type: 'delete-family', tenant, family });
  }

  cancelConfirm(): void {
    this.pendingConfirm.set(null);
  }

  executeConfirm(): void {
    const p = this.pendingConfirm();
    if (!p) return;
    if (p.type === 'approve-reg-tenant' && p.regAccount) {
      this.auth.approveTenantAccount(p.regAccount.username, this.state.currentResidentUnit());
    } else if (p.type === 'reject-reg-tenant' && p.regAccount) {
      this.auth.rejectAccount(p.regAccount.username);
    } else if (p.type === 'delete-tenant' && p.tenant) {
      this.state.deleteTenant(p.tenant.id);
    } else if (p.type === 'delete-family' && p.tenant && p.family) {
      this.state.removeTenantFamilyMember(p.tenant.id, p.family.id);
    } else if (p.type === 'end-lease' && p.tenant) {
      this.state.endTenancy(p.tenant.id);
    }
    this.pendingConfirm.set(null);
  }

  fullName(p: PersonDetails): string {
    return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
  }

  age(dob: string): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
    return a;
  }
}
