import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { Invoice } from '../../../models/society.model';

@Component({
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.css'],
  selector: 'app-member-dashboard',
  standalone: true,
  imports: [CommonModule]
})
export class MemberDashboardComponent {
  readonly state = inject(SocietyStateService);

  get user() { return this.state.memberUser(); }
  get society() { return this.state.society(); }
  get duesAmount() { return this.state.memberA101Dues(); }
  get recentNotice() { return this.state.notices()[0]; }

  get myComplaints() {
    return this.state.complaints().filter(c => c.unitNo === 'A-101');
  }

  get openComplaintsCount() {
    return this.myComplaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
  }

  get resolvedComplaintsCount() {
    return this.myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  }

  get myInvoices() {
    return this.state.invoices().filter(i => i.unitNo === 'A-101');
  }

  get myPayments() {
    return this.state.paymentHistory().filter(p => p.unitNo === 'A-101');
  }

  get myBookings() {
    return this.state.bookings().filter(b => b.unitNo === 'A-101');
  }

  navigateTo(view: string): void {
    this.state.setView(view);
  }

  openPayNow(): void {
    const inv = this.myInvoices.find(i => i.status === 'Unpaid');
    window.dispatchEvent(new CustomEvent('open-pay-modal', { detail: inv || this.myInvoices[0] }));
  }

  openPayNowFor(inv: Invoice): void {
    window.dispatchEvent(new CustomEvent('open-pay-modal', { detail: inv }));
  }

  viewLastReceipt(): void {
    const inv = this.myInvoices.find(i => i.status === 'Paid') || this.myInvoices[0];
    window.dispatchEvent(new CustomEvent('open-receipt-modal', { detail: inv }));
  }

  viewReceiptFor(inv: Invoice): void {
    window.dispatchEvent(new CustomEvent('open-receipt-modal', { detail: inv }));
  }

  openRaiseComplaint(): void {
    window.dispatchEvent(new CustomEvent('open-complaint-modal'));
  }

  openBookAmenity(): void {
    window.dispatchEvent(new CustomEvent('open-booking-modal'));
  }
}
