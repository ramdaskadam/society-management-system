import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Complaint } from '../../../models/society.model';

@Component({
  templateUrl: './raise-complaint-dialog.component.html',
  styleUrls: ['./raise-complaint-dialog.component.css'],
  selector: 'app-raise-complaint-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RaiseComplaintDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ category: string; priority: Complaint['priority']; subject: string; description: string }>();

  category = 'Plumbing';
  priority: Complaint['priority'] = 'Medium';
  subject = '';
  description = '';

  submitComplaint(): void {
    if (!this.subject.trim() || !this.description.trim()) {
      alert('Please fill out the complaint subject and description.');
      return;
    }
    this.submit.emit({
      category: this.category,
      priority: this.priority,
      subject: this.subject,
      description: this.description
    });
    this.subject = '';
    this.description = '';
    this.close.emit();
  }
}
