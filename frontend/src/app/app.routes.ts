import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';

/**
 * Enterprise Lazy-Loaded Route Configuration
 * Supports both state-driven view switching inside `AppComponent` and URL-based navigation.
 */
export const routes: Routes = [
  {
    path: 'admin/dashboard',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./admin/views/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'admin/members',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./admin/views/members-view/members-view.component').then(m => m.MembersViewComponent)
  },
  {
    path: 'admin/reports',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./admin/views/reports-view/reports-view.component').then(m => m.ReportsViewComponent)
  },
  {
    path: 'admin/settings',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./admin/views/settings-view/settings-view.component').then(m => m.SettingsViewComponent)
  },
  {
    path: 'member/dashboard',
    canActivate: [roleGuard(['member', 'admin'])],
    loadComponent: () =>
      import('./member/views/member-dashboard/member-dashboard.component').then(m => m.MemberDashboardComponent)
  },
  {
    path: 'visitors',
    loadComponent: () =>
      import('./shared/views/visitors-view/visitors-view.component').then(m => m.VisitorsViewComponent)
  },
  {
    path: 'polls',
    loadComponent: () =>
      import('./shared/views/polls-view/polls-view.component').then(m => m.PollsViewComponent)
  },
  {
    path: 'parking',
    loadComponent: () =>
      import('./shared/views/parking-view/parking-view.component').then(m => m.ParkingViewComponent)
  }
];
