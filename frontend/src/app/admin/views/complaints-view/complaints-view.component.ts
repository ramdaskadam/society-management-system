import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { Complaint } from '../../../models/society.model';

@Component({
  templateUrl: './complaints-view.component.html',
  styleUrls: ['./complaints-view.component.css'],
  selector: 'app-complaints-view',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComplaintsViewComponent {
  readonly state = inject(SocietyStateService);

  get displayedComplaints(): Complaint[] {
    if (this.state.currentUserRole() === 'member') {
      return this.state.complaints().filter(c => c.unitNo === 'A-101');
    }
    return this.state.complaints();
  }

  getStatusClass(status: Complaint['status']): string {
    switch (status) {
      case 'Open': return 'badge-open';
      case 'In Progress': return 'badge-in-progress';
      case 'Resolved': return 'badge-resolved';
      case 'Closed': return 'badge-closed';
      default: return 'badge-info';
    }
  }

  onStatusChange(id: string, newStatus: Complaint['status']): void {
    this.state.updateComplaintStatus(id, newStatus);
  }

  openRaiseComplaint(): void {
    window.dispatchEvent(new CustomEvent('open-complaint-modal'));
  }
}
