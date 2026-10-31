import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './notices-view.component.html',
  styleUrls: ['./notices-view.component.css'],
  selector: 'app-notices-view',
  standalone: true,
  imports: [CommonModule]
})
export class NoticesViewComponent {
  readonly state = inject(SocietyStateService);

  openCreateNotice(): void {
    window.dispatchEvent(new CustomEvent('open-notice-modal'));
  }

  downloadDoc(file: string): void {
    this.state.showToast(`Downloading: ${file}`, 'info');
  }
}
