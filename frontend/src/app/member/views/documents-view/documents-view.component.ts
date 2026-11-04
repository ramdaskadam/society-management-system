import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { SocietyDocument } from '../../../models/society.model';

@Component({
  templateUrl: './documents-view.component.html',
  styleUrls: ['./documents-view.component.css'],
  selector: 'app-documents-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class DocumentsViewComponent {
  readonly state = inject(SocietyStateService);

  categoryFilter = 'All';
  showUploadForm = false;
  docTitle = '';
  docCategory = 'Legal';
  docAccess = 'All Members';

  get filteredDocs(): SocietyDocument[] {
    if (this.categoryFilter === 'All') return this.state.documents();
    return this.state.documents().filter(d => d.category === this.categoryFilter);
  }

  onUploadDoc(): void {
    if (!this.docTitle.trim()) return;
    this.state.uploadDocument({
      title: this.docTitle.trim(),
      category: this.docCategory,
      access: this.docAccess
    });
    this.docTitle = '';
    this.showUploadForm = false;
  }

  download(title: string): void {
    this.state.showToast(`Downloading: ${title}.pdf`, 'info');
  }
}
