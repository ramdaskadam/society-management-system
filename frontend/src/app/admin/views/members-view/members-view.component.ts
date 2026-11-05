import { ChangeDetectionStrategy, Component, computed, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';

@Component({
  templateUrl: './members-view.component.html',
  styleUrls: ['./members-view.component.css'],
  selector: 'app-members-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MembersViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  readonly searchQuery = signal('');
  readonly selectedWing = signal<string>('All');
  readonly selectedRole = signal<'All' | 'Owner' | 'Tenant'>('All');
  readonly duesFilter = signal<'All' | 'Pending' | 'Clear'>('All');

  readonly wings = ['All', 'A', 'B', 'C', 'D'];

  readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0 ||
    this.selectedWing() !== 'All' ||
    this.selectedRole() !== 'All' ||
    this.duesFilter() !== 'All'
  );

  readonly filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const wing = this.selectedWing();
    const role = this.selectedRole();
    const dues = this.duesFilter();

    return this.state.members().filter(m => {
      if (wing !== 'All' && m.wing !== wing) {
        return false;
      }
      if (role !== 'All' && m.role !== role) {
        return false;
      }
      if (dues === 'Pending' && m.dues <= 0) {
        return false;
      }
      if (dues === 'Clear' && m.dues > 0) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        `wing ${m.wing.toLowerCase()}`.includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  });

  openAddMember(): void {
    this.dialogs.openAddMemberModal();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedWing.set('All');
    this.selectedRole.set('All');
    this.duesFilter.set('All');
  }
}
