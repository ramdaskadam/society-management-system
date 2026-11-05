import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SocietyStateService } from './services/society-state.service';
import { DialogModalService } from './core/services/dialog-modal.service';
import { UserRole } from './models/society.model';
import { TranslatePipe } from './shared/pipes/translate.pipe';

// ── Shared Layout Components ──────────────────────────────────────────────────
import { RoleBannerComponent } from './shared/components/role-banner/role-banner.component';
import { SidebarNavComponent } from './shared/components/sidebar-nav/sidebar-nav.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

// ── Shared Dialogs ────────────────────────────────────────────────────────────
import { ReceiptDialogComponent } from './shared/dialogs/receipt-dialog/receipt-dialog.component';
import { NotificationsDialogComponent } from './shared/dialogs/notifications-dialog/notifications-dialog.component';

// ── Admin Dialogs ─────────────────────────────────────────────────────────────
import { AddMemberDialogComponent } from './admin/dialogs/add-member-dialog/add-member-dialog.component';
import { AddUnitDialogComponent } from './admin/dialogs/add-unit-dialog/add-unit-dialog.component';
import { CreateNoticeDialogComponent } from './admin/dialogs/create-notice-dialog/create-notice-dialog.component';
import { BulkInvoiceDialogComponent } from './admin/dialogs/bulk-invoice-dialog/bulk-invoice-dialog.component';

// ── Member Dialogs ────────────────────────────────────────────────────────────
import { PayNowDialogComponent } from './member/dialogs/pay-now-dialog/pay-now-dialog.component';
import { RaiseComplaintDialogComponent } from './member/dialogs/raise-complaint-dialog/raise-complaint-dialog.component';
import { BookAmenityDialogComponent } from './member/dialogs/book-amenity-dialog/book-amenity-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslatePipe,
    // Shared layout
    RoleBannerComponent,
    SidebarNavComponent,
    TopbarComponent,
    ToastContainerComponent,
    // Shared dialogs
    ReceiptDialogComponent,
    NotificationsDialogComponent,
    // Admin dialogs
    AddMemberDialogComponent,
    AddUnitDialogComponent,
    CreateNoticeDialogComponent,
    BulkInvoiceDialogComponent,
    // Member dialogs
    PayNowDialogComponent,
    RaiseComplaintDialogComponent,
    BookAmenityDialogComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly state = inject(SocietyStateService);
  readonly dialogs = inject(DialogModalService);
  readonly mobileMenuOpen = signal(false);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** App chrome (sidebar/topbar) is hidden on login & registration pages. */
  readonly showShell = computed(() => {
    const url = this.currentUrl();
    const isAuthRoute = url.startsWith('/login') || url.startsWith('/register');
    return this.auth.isAuthenticated() && !isAuthRoute;
  });

  get openComplaintsCount(): number {
    return this.state.currentUserRole() === 'admin'
      ? this.state.metrics().openComplaints
      : this.state
          .activeUnitComplaints()
          .filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  }

  ngOnInit(): void {
    document.body.setAttribute('data-role', this.state.currentUserRole());
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onRoleChange(role: UserRole): void {
    this.state.setRole(role);
    this.mobileMenuOpen.set(false);
    document.body.setAttribute('data-role', role);
  }

  onResetDemo(): void {
    if (confirm('Reset all demo data back to baseline?')) {
      this.state.resetToBaseline();
    }
  }

  onNavSelect(viewId: string): void {
    this.state.setView(viewId);
    this.mobileMenuOpen.set(false);
  }

  onGlobalSearch(query: string): void {
    this.state.setGlobalSearch(query);
  }

  onPaymentConfirmed(event: { invoiceId: string; method: string }): void {
    this.state.payInvoice(event.invoiceId, event.method);
    const updated = this.state.invoices().find(i => i.id === event.invoiceId) || null;
    if (updated) {
      this.dialogs.openReceiptModal(updated);
    }
  }

  onPublishNotice(data: { title: string; category: string; meetingDate?: string; location?: string; summary: string; pinned: boolean }): void {
    this.state.publishNotice(data);
  }

  onRaiseComplaint(data: { category: string; priority: 'High' | 'Medium' | 'Low'; subject: string; description: string }): void {
    this.state.raiseComplaint(data);
  }

  onBookAmenity(data: { amenity: string; date: string; time: string; purpose: string }): void {
    this.state.bookAmenity(data);
  }

  onAddMember(data: { name: string; unit: string; role: string; email: string; phone: string }): void {
    this.state.addMember(data);
  }

  onAddUnit(data: { unitNo: string; wing: string; type: string; area: number; owner: string }): void {
    this.state.addUnit(data);
  }

  onBulkInvoiceConfirm(): void {
    this.state.generateBulkInvoices();
    this.dialogs.closeBulkInvoiceModal();
  }
}
