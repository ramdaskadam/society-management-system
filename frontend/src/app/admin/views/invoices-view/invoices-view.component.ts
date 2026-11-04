import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { Invoice } from '../../../models/society.model';

@Component({
  templateUrl: './invoices-view.component.html',
  styleUrls: ['./invoices-view.component.css'],
  selector: 'app-invoices-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class InvoicesViewComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  openBulkInvoice(): void {
    this.dialogs.openBulkInvoiceModal();
  }

  viewReceipt(inv: Invoice): void {
    this.dialogs.openReceiptModal(inv);
  }

  payInvoice(inv: Invoice): void {
    this.dialogs.openPayModal(inv);
  }
}
