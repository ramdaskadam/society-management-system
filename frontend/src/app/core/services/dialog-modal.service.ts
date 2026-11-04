import { Injectable, signal } from '@angular/core';
import { Invoice } from '../../models/society.model';

/**
 * Strongly-Typed Reactive Dialog & Modal Orchestration Service
 * Replaces untyped `window.dispatchEvent(new CustomEvent(...))` DOM listeners
 * with Angular Signals for SSR safety, type checking, and clean component decoupling.
 */
@Injectable({
  providedIn: 'root'
})
export class DialogModalService {
  readonly showPayModal = signal<boolean>(false);
  readonly activePayInvoice = signal<Invoice | null>(null);

  readonly showReceiptModal = signal<boolean>(false);
  readonly activeReceiptInvoice = signal<Invoice | null>(null);

  readonly showNoticeModal = signal<boolean>(false);
  readonly showComplaintModal = signal<boolean>(false);

  readonly showBookingModal = signal<boolean>(false);
  readonly selectedAmenityForBooking = signal<string>('');

  readonly showAddMemberModal = signal<boolean>(false);
  readonly showAddUnitModal = signal<boolean>(false);
  readonly showBulkInvoiceModal = signal<boolean>(false);
  readonly showNotificationsModal = signal<boolean>(false);

  openPayModal(invoice: Invoice): void {
    this.activePayInvoice.set(invoice);
    this.showPayModal.set(true);
  }

  closePayModal(): void {
    this.showPayModal.set(false);
  }

  openReceiptModal(invoice: Invoice): void {
    this.activeReceiptInvoice.set(invoice);
    this.showReceiptModal.set(true);
  }

  closeReceiptModal(): void {
    this.showReceiptModal.set(false);
  }

  openNoticeModal(): void {
    this.showNoticeModal.set(true);
  }

  closeNoticeModal(): void {
    this.showNoticeModal.set(false);
  }

  openComplaintModal(): void {
    this.showComplaintModal.set(true);
  }

  closeComplaintModal(): void {
    this.showComplaintModal.set(false);
  }

  openBookingModal(amenityName = ''): void {
    this.selectedAmenityForBooking.set(amenityName);
    this.showBookingModal.set(true);
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
  }

  openAddMemberModal(): void {
    this.showAddMemberModal.set(true);
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal.set(false);
  }

  openAddUnitModal(): void {
    this.showAddUnitModal.set(true);
  }

  closeAddUnitModal(): void {
    this.showAddUnitModal.set(false);
  }

  openBulkInvoiceModal(): void {
    this.showBulkInvoiceModal.set(true);
  }

  closeBulkInvoiceModal(): void {
    this.showBulkInvoiceModal.set(false);
  }

  openNotificationsModal(): void {
    this.showNotificationsModal.set(true);
  }

  closeNotificationsModal(): void {
    this.showNotificationsModal.set(false);
  }
}

