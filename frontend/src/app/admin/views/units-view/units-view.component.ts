import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { DataColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { Unit } from '../../../models/society.model';

/**
 * Units & Apartment Registry View.
 * - Tenant History button removed.
 * - Admin can add a new unit or click any unit row to update unit info and assign the flat to an owner via dropdown.
 * - Admin can view Past Owner Details (both inside the unit dialog and via the "Past Owners" toggle).
 */
@Component({
  templateUrl: './units-view.component.html',
  styleUrls: ['./units-view.component.css'],
  selector: 'app-units-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DataTableComponent]
})
export class UnitsViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  /** Toggles between Active Units table (false) and Past Owners Registry (true). */
  readonly showPastOwners = signal(false);

  /** Admins see every unit; residents only see their own flat (the route is shared with /my-unit). */
  readonly visibleUnits = computed<Unit[]>(() =>
    this.state.currentUserRole() === 'admin'
      ? this.state.units()
      : this.state.units().filter(u => u.unitNo === this.state.currentResidentUnit())
  );

  /** Units that have at least one past owner recorded. */
  readonly unitsWithPastOwners = computed<Unit[]>(() =>
    this.visibleUnits().filter(u => (u.pastOwners?.length ?? 0) > 0)
  );

  /** Total count of past owner records across visible units. */
  readonly totalPastOwnersCount = computed<number>(() =>
    this.unitsWithPastOwners().reduce((sum, u) => sum + (u.pastOwners?.length ?? 0), 0)
  );

  /** Wings are derived from data instead of being hardcoded (e.g. "A, B, C, D"). */
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
      key: 'pastOwners',
      label: 'Past Owners',
      value: u =>
        u.pastOwners?.length
          ? u.pastOwners.map(p => `${p.ownerName} (${p.fromDate} → ${p.toDate})`).join(', ')
          : '—'
    },
    {
      key: 'occupancy',
      label: 'Occupancy Status',
      type: 'badge',
      badgeClass: u => (u.occupancy.includes('Owner') ? 'badge-confirmed' : 'badge-pending')
    },
    { key: 'dues', label: 'Outstanding', type: 'currency', color: u => (u.dues > 0 ? '#ef4444' : '#10b981') },
    {
      key: 'id',
      label: 'Manage',
      sortable: false,
      type: 'badge',
      value: () => (this.state.currentUserRole() === 'admin' ? 'Edit / Assign Owner' : 'View'),
      badgeClass: () => 'badge-info'
    }
  ];

  openAddUnit(): void {
    this.dialogs.openAddUnitModal(null);
  }

  onUnitRowClick(unit: Unit): void {
    if (this.state.currentUserRole() === 'admin') {
      this.dialogs.openAddUnitModal(unit);
    }
  }

  togglePastOwners(): void {
    this.showPastOwners.update(v => !v);
  }
}
