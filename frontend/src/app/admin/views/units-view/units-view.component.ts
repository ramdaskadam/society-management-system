import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';

@Component({
  templateUrl: './units-view.component.html',
  styleUrls: ['./units-view.component.css'],
  selector: 'app-units-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class UnitsViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  openAddUnit(): void {
    this.dialogs.openAddUnitModal();
  }
}
