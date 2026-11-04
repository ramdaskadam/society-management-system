import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../../models/society.model';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number | null;
}

@Component({
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.css'],
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule]
})
export class SidebarNavComponent {
  @Input() role: UserRole = 'admin';
  @Input() currentView: string = 'dashboard';
  @Input() openComplaintsCount: number = 0;
  @Input() user: User = { name: '', role: '', email: '', avatar: '' };
  @Input() societyName: string = 'Green Meadows';
  @Output() navSelect = new EventEmitter<string>();

  get navItems(): NavItem[] {
    if (this.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid', badge: null },
        { id: 'members', label: 'Members', icon: 'users', badge: null },
        { id: 'units', label: 'Units', icon: 'building', badge: null },
        { id: 'maintenance', label: 'Maintenance', icon: 'tool', badge: null },
        { id: 'payments', label: 'Payments', icon: 'credit-card', badge: null },
        { id: 'complaints', label: 'Complaints', icon: 'alert', badge: this.openComplaintsCount || 12 },
        { id: 'visitors', label: 'Visitors & Gate', icon: 'shield', badge: null },
        { id: 'parking', label: 'Parking & EV', icon: 'car', badge: null },
        { id: 'polls', label: 'Polls & Voting', icon: 'check-square', badge: null },
        { id: 'notices', label: 'Notices', icon: 'megaphone', badge: null },
        { id: 'amenities', label: 'Amenities', icon: 'calendar', badge: null },
        { id: 'documents', label: 'Documents', icon: 'file', badge: null },
        { id: 'reports', label: 'Reports', icon: 'bar-chart', badge: null },
        { id: 'settings', label: 'Settings', icon: 'settings', badge: null }
      ];
    } else {
      return [
        { id: 'dashboard', label: 'My Dashboard', icon: 'home', badge: null },
        { id: 'profile', label: 'My Profile', icon: 'user', badge: null },
        { id: 'my-unit', label: 'My Unit', icon: 'building', badge: null },
        { id: 'maintenance', label: 'Maintenance', icon: 'tool', badge: null },
        { id: 'payments', label: 'Invoices & Payments', icon: 'credit-card', badge: null },
        { id: 'complaints', label: 'Complaints', icon: 'alert', badge: this.openComplaintsCount || null },
        { id: 'visitors', label: 'Visitors & Gate', icon: 'shield', badge: null },
        { id: 'parking', label: 'Parking & EV', icon: 'car', badge: null },
        { id: 'polls', label: 'Polls & Voting', icon: 'check-square', badge: null },
        { id: 'amenities', label: 'Amenities', icon: 'calendar', badge: null },
        { id: 'notices', label: 'Notices', icon: 'megaphone', badge: null },
        { id: 'documents', label: 'Documents', icon: 'file', badge: null },
        { id: 'help', label: 'Help & Support', icon: 'help-circle', badge: null }
      ];
    }
  }
}
