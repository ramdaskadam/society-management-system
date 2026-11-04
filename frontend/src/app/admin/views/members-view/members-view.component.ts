import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  imports: [CommonModule, FormsModule]
})
export class MembersViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  openAddMember(): void {
    this.dialogs.openAddMemberModal();
  }
}
