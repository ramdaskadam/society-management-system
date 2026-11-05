import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { AccessAction, AccessControlService } from '../../../core/services/access-control.service';

@Component({
  templateUrl: './access-control-view.component.html',
  selector: 'app-access-control-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class AccessControlViewComponent {
  readonly state = inject(SocietyStateService);
  readonly access = inject(AccessControlService);

  readonly selectedMemberId = signal<string>('');
  readonly memberSearch = signal('');

  readonly filteredMembers = computed(() => {
    const q = this.memberSearch().toLowerCase().trim();
    return this.state
      .members()
      .filter(m => !q || m.name.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  });

  readonly selectedMember = computed(() => {
    const id = this.selectedMemberId() || this.state.members()[0]?.id;
    return this.state.members().find(m => m.id === id) ?? null;
  });

  readonly totalSlots = this.access.modules.length * this.access.actions.length;

  select(id: string): void {
    this.selectedMemberId.set(id);
  }

  toggle(moduleId: string, action: AccessAction, event: Event): void {
    const member = this.selectedMember();
    if (!member) return;
    this.access.set(member.id, moduleId, action, (event.target as HTMLInputElement).checked);
  }

  columnState(action: AccessAction): 'all' | 'none' | 'some' {
    const member = this.selectedMember();
    if (!member) return 'none';
    const on = this.access.modules.filter(m => this.access.flags(member.id, m.id)[action]).length;
    return on === 0 ? 'none' : on === this.access.modules.length ? 'all' : 'some';
  }
}

