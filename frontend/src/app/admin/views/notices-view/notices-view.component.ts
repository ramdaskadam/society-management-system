import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';

@Component({
  templateUrl: './notices-view.component.html',
  styleUrls: ['./notices-view.component.css'],
  selector: 'app-notices-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class NoticesViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  openCreateNotice(): void {
    this.dialogs.openNoticeModal();
  }

  downloadDoc(file: string): void {
    this.state.showToast(`Downloading: ${file}`, 'info');
  }
}
