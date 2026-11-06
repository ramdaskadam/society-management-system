import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SocietyStateService } from '../../../services/society-state.service';
import { FamilyMember, PersonDetails, TenantRecord } from '../../../models/society.model';
import {
  PersonDialogComponent,
  PersonDialogData,
  PersonFormResult
} from '../../../shared/dialogs/person-dialog/person-dialog.component';
import { DataColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';

/**
 * Tenants & Sub-Tenants Management View.
 * Allows flat owners / residents to:
 *  - Add, update, move-out, and delete tenants for their unit
 *  - Add, update, and delete each tenant's family members (secondary occupants)
 *  - View complete Tenant History for the same flat via the "Tenant History" button
 */
@Component({
  selector: 'app-tenants-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PersonDialogComponent, DataTableComponent, TranslatePipe],
  templateUrl: './tenants-view.component.html'
})
export class TenantsViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly i18n = inject(I18nService);

  /** Toggles between Active Tenants view (false) and Flat Tenant History view (true). */
  private readonly route = inject(ActivatedRoute);
  readonly showHistory = signal(this.route.snapshot.queryParamMap.get('history') === '1');

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

  /** Complete chronological tenant history for the flat (active + past). */
  readonly allFlatHistory = computed(() =>
    [...this.state.activeUnitTenants()].sort((a, b) => b.leaseStart.localeCompare(a.leaseStart))
  );

  /** Columns for the dynamic Tenant History summary table (<app-data-table>). */
  readonly historyColumns: DataColumn<TenantRecord>[] = [
    { key: 'firstName', label: 'Tenant Name', bold: true, value: t => this.fullName(t) },
    { key: 'unitNo', label: 'Flat', prefix: 'Flat ' },
    { key: 'leaseStart', label: 'Lease Period', value: t => `${t.leaseStart} → ${t.leaseEnd}` },
    { key: 'monthlyRent', label: 'Monthly Rent', type: 'currency' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'familyMembers',
      label: 'Family Members',
      value: t => (t.familyMembers.length ? `${t.familyMembers.length} (${t.familyMembers.map(f => f.firstName).join(', ')})` : 'None')
    },
    {
      key: 'policeVerified',
      label: 'Verification',
      type: 'badge',
      value: t => (t.policeVerified ? 'Verified' : 'Pending'),
      badgeClass: t => (t.policeVerified ? 'badge-confirmed' : 'badge-pending')
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      badgeClass: t => (t.status === 'Active' ? 'badge-active' : 'badge-closed')
    }
  ];

  /** Which dialog mode is open: 'none' | 'tenant' | 'family'. */
  readonly dialogMode = signal<'none' | 'tenant' | 'family'>('none');
  /** Tenant being edited (when dialogMode === 'tenant'), or parent tenant when adding/editing a family member. */
  readonly activeTenant = signal<TenantRecord | null>(null);
  /** Family member of `activeTenant` being edited (null = adding new family member). */
  readonly editingFamily = signal<FamilyMember | null>(null);

  /** Inline delete confirmation states. */
  readonly confirmDeleteTenantId = signal<string | null>(null);
  readonly confirmDeleteFamilyKey = signal<string | null>(null);

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

  openAddTenant(): void {
    this.activeTenant.set(null);
    this.editingFamily.set(null);
    this.dialogMode.set('tenant');
  }

  openEditTenant(t: TenantRecord): void {
    this.activeTenant.set(t);
    this.editingFamily.set(null);
    this.dialogMode.set('tenant');
  }

  openAddFamily(t: TenantRecord): void {
    this.activeTenant.set(t);
    this.editingFamily.set(null);
    this.dialogMode.set('family');
  }

  openEditFamily(t: TenantRecord, f: FamilyMember): void {
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
        this.state.updateTenant(existing.id, res.details, res.lease);
      } else {
        this.state.addTenant(res.details, res.lease);
      }
    } else if (this.dialogMode() === 'family') {
      const tenant = this.activeTenant();
      if (tenant) {
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

  endLease(id: string): void {
    this.state.endTenancy(id);
  }

  askDeleteTenant(id: string): void {
    this.confirmDeleteTenantId.set(id);
  }

  cancelDeleteTenant(): void {
    this.confirmDeleteTenantId.set(null);
  }

  confirmDeleteTenant(id: string): void {
    this.state.deleteTenant(id);
    this.confirmDeleteTenantId.set(null);
  }

  familyKey(tenantId: string, familyId: string): string {
    return `${tenantId}:${familyId}`;
  }

  askDeleteFamily(tenantId: string, familyId: string): void {
    this.confirmDeleteFamilyKey.set(this.familyKey(tenantId, familyId));
  }

  cancelDeleteFamily(): void {
    this.confirmDeleteFamilyKey.set(null);
  }

  confirmDeleteFamily(tenantId: string, familyId: string): void {
    this.state.removeTenantFamilyMember(tenantId, familyId);
    this.confirmDeleteFamilyKey.set(null);
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
