import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/society.model';

@Component({
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TopbarComponent {
  @Input() user: User = { name: '', role: '', email: '', avatar: '' };
  @Input() role: UserRole = 'admin';
  @Input() unreadNotificationsCount: number = 0;
  @Output() openNotifications = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();

  query = '';

  onSearchChange(val: string): void {
    this.search.emit(val);
  }
}
