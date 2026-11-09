import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { accessGuard, authGuard, guestGuard } from './core/guards/auth.guard';

/**
 * Enterprise Lazy-Loaded Route Configuration (`<router-outlet>`)
 * - `/login` & `/register` are public (guest-only).
 * - Everything else requires authentication (`authGuard`) and, for residents,
 *   admin-granted `read` access to the module (`accessGuard`).
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [accessGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./shared/views/dashboard-host/dashboard-host.component').then(m => m.DashboardHostComponent)
      },
      {
        path: 'members',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./admin/views/members-view/members-view.component').then(m => m.MembersViewComponent)
      },
      {
        path: 'access-control',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./admin/views/access-control-view/access-control-view.component').then(
            m => m.AccessControlViewComponent
          )
      },
      {
        path: 'approvals',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./admin/views/approvals-view/approvals-view.component').then(
            m => m.ApprovalsViewComponent
          )
      },
      {
        path: 'units',
        loadComponent: () =>
          import('./admin/views/units-view/units-view.component').then(m => m.UnitsViewComponent)
      },
      {
        path: 'my-unit',
        loadComponent: () =>
          import('./admin/views/units-view/units-view.component').then(m => m.UnitsViewComponent)
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./member/views/tenants-view/tenants-view.component').then(m => m.TenantsViewComponent)
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./admin/views/invoices-view/invoices-view.component').then(m => m.InvoicesViewComponent)
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./admin/views/invoices-view/invoices-view.component').then(m => m.InvoicesViewComponent)
      },
      {
        path: 'complaints',
        loadComponent: () =>
          import('./admin/views/complaints-view/complaints-view.component').then(m => m.ComplaintsViewComponent)
      },
      {
        path: 'visitors',
        loadComponent: () =>
          import('./shared/views/visitors-view/visitors-view.component').then(m => m.VisitorsViewComponent)
      },
      {
        path: 'parking',
        loadComponent: () =>
          import('./shared/views/parking-view/parking-view.component').then(m => m.ParkingViewComponent)
      },
      {
        path: 'polls',
        loadComponent: () =>
          import('./shared/views/polls-view/polls-view.component').then(m => m.PollsViewComponent)
      },
      {
        path: 'notices',
        loadComponent: () =>
          import('./admin/views/notices-view/notices-view.component').then(m => m.NoticesViewComponent)
      },
      {
        path: 'amenities',
        loadComponent: () =>
          import('./admin/views/amenities-view/amenities-view.component').then(m => m.AmenitiesViewComponent)
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./member/views/documents-view/documents-view.component').then(m => m.DocumentsViewComponent)
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./admin/views/reports-view/reports-view.component').then(m => m.ReportsViewComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./member/views/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['admin'])],
        loadComponent: () =>
          import('./admin/views/settings-view/settings-view.component').then(m => m.SettingsViewComponent)
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./admin/views/settings-view/settings-view.component').then(m => m.SettingsViewComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
