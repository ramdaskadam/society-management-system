import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: './create-notice-dialog.component.html',
  styleUrls: ['./create-notice-dialog.component.css'],
  selector: 'app-create-notice-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CreateNoticeDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ title: string; category: string; meetingDate?: string; location?: string; summary: string; pinned: boolean }>();

  title = '';
  category = 'General Announcement';
  meetingDate = '';
  location = 'All Wings';
  summary = '';
  pinned = true;

  submitNotice(): void {
    if (!this.title.trim() || !this.summary.trim()) {
      alert('Please fill out notice title and details.');
      return;
    }
    this.submit.emit({
      title: this.title,
      category: this.category,
      meetingDate: this.meetingDate,
      location: this.location,
      summary: this.summary,
      pinned: this.pinned
    });
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.title = '';
    this.summary = '';
    this.meetingDate = '';
  }
}
