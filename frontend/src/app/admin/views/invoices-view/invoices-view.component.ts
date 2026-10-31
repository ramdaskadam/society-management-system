import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { Invoice } from '../../../models/society.model';

@Component({
  templateUrl: './invoices-view.component.html',
  styleUrls: ['./invoices-view.component.css'],
  selector: 'app-invoices-view',
  standalone: true,
  imports: [CommonModule]
})
export class InvoicesViewComponent {
  readonly state = inject(SocietyStateService);

  openBulkInvoice(): void {
    window.dispatchEvent(new CustomEvent('open-bulk-invoice-modal'));
  }

  viewReceipt(inv: Invoice): void {
    window.dispatchEvent(new CustomEvent('open-receipt-modal', { detail: inv }));
  }

  payInvoice(inv: Invoice): void {
    window.dispatchEvent(new CustomEvent('open-pay-modal', { detail: inv }));
  }
}
