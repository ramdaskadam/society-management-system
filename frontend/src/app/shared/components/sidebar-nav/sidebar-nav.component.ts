import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../../models/society.model';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../../core/services/auth.service';
import { AccessControlService, VIEW_TO_MODULE } from '../../../core/services/access-control.service';
import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';

interface NavItem {
  id: string;
  labelKey: string;
  icon: string;
  badge?: number | null;
}

@Component({
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.css'],
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, TranslatePipe]
})
export class SidebarNavComponent {
  readonly auth = inject(AuthService);
  private readonly access = inject(AccessControlService);
  private readonly workflow = inject(ApprovalWorkflowService);

  @Input() role: UserRole = 'admin';
  @Input() currentView: string = 'dashboard';
  @Input() openComplaintsCount: number = 0;
  @Input() user: User = { name: '', role: '', email: '', avatar: '' };
  @Input() societyName: string = 'Green Meadows';
  @Input() mobileOpen: boolean = false;
  @Output() navSelect = new EventEmitter<string>();
  @Output() closeMobile = new EventEmitter<void>();

  get navItems(): NavItem[] {
    return this.allNavItems.filter(item => {
      const moduleId = VIEW_TO_MODULE[item.id];
      return !moduleId || this.access.can(moduleId, 'read');
    });
  }

  private get allNavItems(): NavItem[] {
    if (this.role === 'admin') {
      return [
        { id: 'dashboard', labelKey: 'nav.dashboard', icon: 'grid', badge: null },
        { id: 'members', labelKey: 'nav.members', icon: 'users', badge: null },
        { id: 'access-control', labelKey: 'nav.accessControl', icon: 'shield', badge: null },
        { id: 'approvals', labelKey: 'nav.approvals', icon: 'check-square', badge: this.workflow.pendingCount() || null },
        { id: 'units', labelKey: 'nav.units', icon: 'building', badge: null },
        { id: 'maintenance', labelKey: 'nav.maintenance', icon: 'tool', badge: null },
        { id: 'payments', labelKey: 'nav.payments', icon: 'credit-card', badge: null },
        { id: 'complaints', labelKey: 'nav.complaints', icon: 'alert', badge: this.openComplaintsCount || 12 },
        { id: 'visitors', labelKey: 'nav.visitors', icon: 'shield', badge: null },
        { id: 'parking', labelKey: 'nav.parking', icon: 'car', badge: null },
        { id: 'polls', labelKey: 'nav.polls', icon: 'check-square', badge: null },
        { id: 'notices', labelKey: 'nav.notices', icon: 'megaphone', badge: null },
        { id: 'amenities', labelKey: 'nav.amenities', icon: 'calendar', badge: null },
        { id: 'documents', labelKey: 'nav.documents', icon: 'file', badge: null },
        { id: 'reports', labelKey: 'nav.reports', icon: 'bar-chart', badge: null },
        { id: 'settings', labelKey: 'nav.settings', icon: 'settings', badge: null }
      ];
    } else {
      return [
        { id: 'dashboard', labelKey: 'nav.myDashboard', icon: 'home', badge: null },
        { id: 'profile', labelKey: 'nav.profile', icon: 'user', badge: null },
        { id: 'my-unit', labelKey: 'nav.myUnit', icon: 'building', badge: null },
        { id: 'tenants', labelKey: 'nav.tenants', icon: 'users', badge: null },
        { id: 'maintenance', labelKey: 'nav.maintenance', icon: 'tool', badge: null },
        { id: 'payments', labelKey: 'nav.invoicesPayments', icon: 'credit-card', badge: null },
        { id: 'complaints', labelKey: 'nav.complaints', icon: 'alert', badge: this.openComplaintsCount || null },
        { id: 'visitors', labelKey: 'nav.visitors', icon: 'shield', badge: null },
        { id: 'parking', labelKey: 'nav.parking', icon: 'car', badge: null },
        { id: 'polls', labelKey: 'nav.polls', icon: 'check-square', badge: null },
        { id: 'amenities', labelKey: 'nav.amenities', icon: 'calendar', badge: null },
        { id: 'notices', labelKey: 'nav.notices', icon: 'megaphone', badge: null },
        { id: 'documents', labelKey: 'nav.documents', icon: 'file', badge: null },
        { id: 'help', labelKey: 'nav.help', icon: 'help-circle', badge: null }
      ];
    }
  }
}
