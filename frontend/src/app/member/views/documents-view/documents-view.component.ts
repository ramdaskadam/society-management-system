import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './documents-view.component.html',
  styleUrls: ['./documents-view.component.css'],
  selector: 'app-documents-view',
  standalone: true,
  imports: [CommonModule]
})
export class DocumentsViewComponent {
  readonly state = inject(SocietyStateService);

  download(title: string): void {
    this.state.showToast(`Downloading: ${title}.pdf`, 'info');
  }
}
