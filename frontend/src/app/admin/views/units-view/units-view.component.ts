import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { Router } from '@angular/router';
import { DataColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { Unit } from '../../../models/society.model';

/**
 * Units registry.
 * Flow: state store (API/mock) -> `visibleUnits` (role-filtered) -> dynamic <app-data-table>.
 * Columns are plain config, so adding a field returned by the backend is a one-line change.
 */
@Component({
  templateUrl: './units-view.component.html',
  styleUrls: ['./units-view.component.css'],
  selector: 'app-units-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent, TranslatePipe]
})
export class UnitsViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);
  private readonly router = inject(Router);

  /** Admins see every unit; residents only see their own flat (the route is shared with /my-unit). */
  readonly visibleUnits = computed<Unit[]>(() =>
    this.state.currentUserRole() === 'admin'
      ? this.state.units()
      : this.state.units().filter(u => u.unitNo === this.state.currentResidentUnit())
  );

  /** Wings are derived from data instead of being hardcoded (e.g. "A, B, C, D"). */
  readonly pastTenantsCount = computed(() =>
    this.state.activeUnitTenants().filter(t => t.status === 'Past').length
  );

  readonly wingSummary = computed(() => {
    const wings = [...new Set(this.state.units().map(u => u.wing))].sort();
    return wings.length ? wings.join(', ') : '-';
  });

  readonly columns: DataColumn<Unit>[] = [
    { key: 'unitNo', label: 'Unit No', bold: true },
    { key: 'wing', label: 'Wing', prefix: 'Wing ' },
    { key: 'floor', label: 'Floor', type: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'area', label: 'Carpet Area', type: 'number', suffix: ' sq.ft' },
    { key: 'owner', label: 'Registered Owner', bold: true },
    {
      key: 'occupancy',
      label: 'Occupancy Status',
      type: 'badge',
      badgeClass: u => (u.occupancy.includes('Owner') ? 'badge-confirmed' : 'badge-pending')
    },
    { key: 'dues', label: 'Outstanding', type: 'currency', color: u => (u.dues > 0 ? '#ef4444' : '#10b981') }
  ];

  viewTenantHistory(): void {
    this.state.currentView.set('tenants');
    this.router.navigate(['/tenants'], { queryParams: { history: '1' } });
  }

  openAddUnit(): void {
    this.dialogs.openAddUnitModal();
  }
}
