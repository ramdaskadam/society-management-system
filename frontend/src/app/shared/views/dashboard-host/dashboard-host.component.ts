import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { AdminDashboardComponent } from '../../../admin/views/admin-dashboard/admin-dashboard.component';
import { MemberDashboardComponent } from '../../../member/views/member-dashboard/member-dashboard.component';

@Component({
  selector: 'app-dashboard-host',
  standalone: true,
  imports: [CommonModule, AdminDashboardComponent, MemberDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.currentUserRole() === 'admin') {
      <app-admin-dashboard />
    } @else {
      <app-member-dashboard />
    }
  `
})
export class DashboardHostComponent {
  readonly state = inject(SocietyStateService);
}

