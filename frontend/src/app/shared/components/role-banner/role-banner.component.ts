import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../models/society.model';

@Component({
  templateUrl: './role-banner.component.html',
  styleUrls: ['./role-banner.component.css'],
  selector: 'app-role-banner',
  standalone: true,
  imports: [CommonModule]
})
export class RoleBannerComponent {
  @Input() currentRole: UserRole = 'admin';
  @Input() societyName: string = 'Green Meadows';
  @Output() roleChange = new EventEmitter<UserRole>();
  @Output() resetDemo = new EventEmitter<void>();
}
