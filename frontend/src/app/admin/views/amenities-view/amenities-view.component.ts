import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';

@Component({
  templateUrl: './amenities-view.component.html',
  styleUrls: ['./amenities-view.component.css'],
  selector: 'app-amenities-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class AmenitiesViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  openBookingModal(name: string): void {
    this.dialogs.openBookingModal(name);
  }
}
