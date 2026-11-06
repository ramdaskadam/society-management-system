import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { DataColumn, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
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
  imports: [DataTableComponent]
})
export class UnitsViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  /** Admins see every unit; residents only see their own flat (the route is shared with /my-unit). */
  readonly visibleUnits = computed<Unit[]>(() =>
    this.state.currentUserRole() === 'admin'
      ? this.state.units()
      : this.state.units().filter(u => u.unitNo === this.state.currentResidentUnit())
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
      key: 'occupancy',
      label: 'Occupancy Status',
      type: 'badge',
      badgeClass: u => (u.occupancy.includes('Owner') ? 'badge-confirmed' : 'badge-pending')
    },
    { key: 'dues', label: 'Outstanding', type: 'currency', color: u => (u.dues > 0 ? '#ef4444' : '#10b981') }
  ];

  openAddUnit(): void {
    this.dialogs.openAddUnitModal();
  }
}
