import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from './services/society-state.service';
import { UserRole, Invoice } from './models/society.model';

// ── Shared Layout Components ──────────────────────────────────────────────────
import { RoleBannerComponent } from './shared/components/role-banner/role-banner.component';
import { SidebarNavComponent } from './shared/components/sidebar-nav/sidebar-nav.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

// ── Shared Dialogs ────────────────────────────────────────────────────────────
import { ReceiptDialogComponent } from './shared/dialogs/receipt-dialog/receipt-dialog.component';
import { NotificationsDialogComponent } from './shared/dialogs/notifications-dialog/notifications-dialog.component';

// ── Admin Views ───────────────────────────────────────────────────────────────
import { AdminDashboardComponent } from './admin/views/admin-dashboard/admin-dashboard.component';
import { MembersViewComponent } from './admin/views/members-view/members-view.component';
import { UnitsViewComponent } from './admin/views/units-view/units-view.component';
import { InvoicesViewComponent } from './admin/views/invoices-view/invoices-view.component';
import { ComplaintsViewComponent } from './admin/views/complaints-view/complaints-view.component';
import { NoticesViewComponent } from './admin/views/notices-view/notices-view.component';
import { AmenitiesViewComponent } from './admin/views/amenities-view/amenities-view.component';
import { ReportsViewComponent } from './admin/views/reports-view/reports-view.component';
import { SettingsViewComponent } from './admin/views/settings-view/settings-view.component';

// ── Admin Dialogs ─────────────────────────────────────────────────────────────
import { AddMemberDialogComponent } from './admin/dialogs/add-member-dialog/add-member-dialog.component';
import { AddUnitDialogComponent } from './admin/dialogs/add-unit-dialog/add-unit-dialog.component';
import { CreateNoticeDialogComponent } from './admin/dialogs/create-notice-dialog/create-notice-dialog.component';
import { BulkInvoiceDialogComponent } from './admin/dialogs/bulk-invoice-dialog/bulk-invoice-dialog.component';

// ── Member Views ──────────────────────────────────────────────────────────────
import { MemberDashboardComponent } from './member/views/member-dashboard/member-dashboard.component';
import { DocumentsViewComponent } from './member/views/documents-view/documents-view.component';
import { ProfileViewComponent } from './member/views/profile-view/profile-view.component';

// ── Shared Feature Views ──────────────────────────────────────────────────────
import { VisitorsViewComponent } from './shared/views/visitors-view/visitors-view.component';
import { PollsViewComponent } from './shared/views/polls-view/polls-view.component';
import { ParkingViewComponent } from './shared/views/parking-view/parking-view.component';

// ── Member Dialogs ────────────────────────────────────────────────────────────
import { PayNowDialogComponent } from './member/dialogs/pay-now-dialog/pay-now-dialog.component';
import { RaiseComplaintDialogComponent } from './member/dialogs/raise-complaint-dialog/raise-complaint-dialog.component';
import { BookAmenityDialogComponent } from './member/dialogs/book-amenity-dialog/book-amenity-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    // Shared layout
    RoleBannerComponent,
    SidebarNavComponent,
    TopbarComponent,
    ToastContainerComponent,
    // Shared dialogs
    ReceiptDialogComponent,
    NotificationsDialogComponent,
    // Admin views
    AdminDashboardComponent,
    MembersViewComponent,
    UnitsViewComponent,
    InvoicesViewComponent,
    ComplaintsViewComponent,
    NoticesViewComponent,
    AmenitiesViewComponent,
    ReportsViewComponent,
    SettingsViewComponent,
    // Admin dialogs
    AddMemberDialogComponent,
    AddUnitDialogComponent,
    CreateNoticeDialogComponent,
    BulkInvoiceDialogComponent,
    // Member views
    MemberDashboardComponent,
    DocumentsViewComponent,
    ProfileViewComponent,
    // Shared feature views
    VisitorsViewComponent,
    PollsViewComponent,
    ParkingViewComponent,
    // Member dialogs
    PayNowDialogComponent,
    RaiseComplaintDialogComponent,
    BookAmenityDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  readonly state = inject(SocietyStateService);

  // Dialog visibility states
  showPayModal = false;
  activePayInvoice: Invoice | null = null;

  showReceiptModal = false;
  activeReceiptInvoice: Invoice | null = null;

  showNoticeModal = false;
  showComplaintModal = false;
  showBookingModal = false;
  selectedAmenityForBooking = '';
  showAddMemberModal = false;
  showAddUnitModal = false;
  showBulkInvoiceModal = false;
  showNotificationsModal = false;

  get openComplaintsCount(): number {
    return this.state.currentUserRole() === 'admin'
      ? this.state.metrics().openComplaints
      : this.state.complaints().filter(c => c.unitNo === 'A-101' && (c.status === 'Open' || c.status === 'In Progress')).length;
  }

  ngOnInit(): void {
    document.body.setAttribute('data-role', this.state.currentUserRole());
  }

  onRoleChange(role: UserRole): void {
    this.state.setRole(role);
    document.body.setAttribute('data-role', role);
  }

  onResetDemo(): void {
    if (confirm('Reset all demo data back to baseline?')) {
      this.state.resetToBaseline();
    }
  }

  onNavSelect(viewId: string): void {
    this.state.setView(viewId);
  }

  onGlobalSearch(query: string): void {
    const q = query.toLowerCase().trim();
    if (!q) return;
    if (q === 'notice' || q === 'meeting' || q === 'agm') {
      this.state.setView('notices');
    } else if (q === 'complaint' || q === 'plumbing' || q === 'lift') {
      this.state.setView('complaints');
    } else if (q === 'amenity' || q === 'hall' || q === 'clubhouse') {
      this.state.setView('amenities');
    } else if (q === 'member' || q === 'unit' || q === 'a-101') {
      this.state.setView(this.state.currentUserRole() === 'admin' ? 'members' : 'my-unit');
    } else if (q === 'visitor' || q === 'gate' || q === 'otp' || q === 'delivery') {
      this.state.setView('visitors');
    } else if (q === 'poll' || q === 'vote' || q === 'solar') {
      this.state.setView('polls');
    } else if (q === 'parking' || q === 'ev' || q === 'vehicle' || q === 'car') {
      this.state.setView('parking');
    }
  }

  onPaymentConfirmed(event: { invoiceId: string; method: string }): void {
    this.state.payInvoice(event.invoiceId, event.method);
    const updated = this.state.invoices().find(i => i.id === event.invoiceId) || null;
    this.activeReceiptInvoice = updated;
    this.showReceiptModal = true;
  }

  onPublishNotice(data: any): void {
    this.state.publishNotice(data);
  }

  onRaiseComplaint(data: any): void {
    this.state.raiseComplaint(data);
  }

  onBookAmenity(data: any): void {
    this.state.bookAmenity(data);
  }

  onAddMember(data: any): void {
    this.state.addMember(data);
  }

  onAddUnit(data: any): void {
    this.state.addUnit(data);
  }

  onBulkInvoiceConfirm(): void {
    this.state.generateBulkInvoices();
    this.showBulkInvoiceModal = false;
  }

  // Global custom event listeners for cross-component dialog triggers
  @HostListener('window:open-pay-modal', ['$event'])
  handleOpenPayModal(event: CustomEvent<Invoice>): void {
    this.activePayInvoice = event.detail || this.state.invoices()[0];
    this.showPayModal = true;
  }

  @HostListener('window:open-receipt-modal', ['$event'])
  handleOpenReceiptModal(event: CustomEvent<Invoice>): void {
    this.activeReceiptInvoice = event.detail || this.state.invoices().find(i => i.status === 'Paid') || this.state.invoices()[0];
    this.showReceiptModal = true;
  }

  @HostListener('window:open-notice-modal')
  handleOpenNoticeModal(): void {
    this.showNoticeModal = true;
  }

  @HostListener('window:open-complaint-modal')
  handleOpenComplaintModal(): void {
    this.showComplaintModal = true;
  }

  @HostListener('window:open-booking-modal', ['$event'])
  handleOpenBookingModal(event: CustomEvent<string>): void {
    this.selectedAmenityForBooking = event.detail || '';
    this.showBookingModal = true;
  }

  @HostListener('window:open-add-member-modal')
  handleOpenAddMemberModal(): void {
    this.showAddMemberModal = true;
  }

  @HostListener('window:open-add-unit-modal')
  handleOpenAddUnitModal(): void {
    this.showAddUnitModal = true;
  }

  @HostListener('window:open-bulk-invoice-modal')
  handleOpenBulkInvoiceModal(): void {
    this.showBulkInvoiceModal = true;
  }
}
