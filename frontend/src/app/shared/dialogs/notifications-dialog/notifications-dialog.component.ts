import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotification } from '../../../models/society.model';

@Component({
  templateUrl: './notifications-dialog.component.html',
  styleUrls: ['./notifications-dialog.component.css'],
  selector: 'app-notifications-dialog',
  standalone: true,
  imports: [CommonModule]
})
export class NotificationsDialogComponent {
  @Input() isOpen = false;
  @Input() notifications: AppNotification[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() markAllRead = new EventEmitter<void>();
}
