import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { Invoice } from '../../../models/society.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.css'],
  selector: 'app-member-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe]
})
export class MemberDashboardComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  get user() { return this.state.memberUser(); }
  get society() { return this.state.society(); }
  get duesAmount() { return this.state.activeUnitDues(); }
  get recentNotice() { return this.state.notices()[0]; }

  get myComplaints() {
    return this.state.activeUnitComplaints();
  }

  get openComplaintsCount() {
    return this.myComplaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  }

  get resolvedComplaintsCount() {
    return this.myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  }

  get myInvoices() {
    return this.state.activeUnitInvoices();
  }

  get myPayments() {
    return this.state.activeUnitPayments();
  }

  get myBookings() {
    return this.state.activeUnitBookings();
  }

  navigateTo(view: string): void {
    this.state.setView(view);
  }

  openPayNow(): void {
    const inv = this.myInvoices.find(i => i.status === 'Unpaid') || this.myInvoices[0];
    if (inv) {
      this.dialogs.openPayModal(inv);
    }
  }

  openPayNowFor(inv: Invoice): void {
    this.dialogs.openPayModal(inv);
  }

  viewLastReceipt(): void {
    const inv = this.myInvoices.find(i => i.status === 'Paid') || this.myInvoices[0];
    if (inv) {
      this.dialogs.openReceiptModal(inv);
    }
  }

  viewReceiptFor(inv: Invoice): void {
    this.dialogs.openReceiptModal(inv);
  }

  openRaiseComplaint(): void {
    this.dialogs.openComplaintModal();
  }

  openBookAmenity(): void {
    this.dialogs.openBookingModal();
  }
}
