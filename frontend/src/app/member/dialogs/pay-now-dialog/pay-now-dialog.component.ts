import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Invoice } from '../../../models/society.model';

@Component({
  templateUrl: './pay-now-dialog.component.html',
  styleUrls: ['./pay-now-dialog.component.css'],
  selector: 'app-pay-now-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PayNowDialogComponent {
  @Input() isOpen = false;
  @Input() invoice: Invoice | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() paid = new EventEmitter<{ invoiceId: string; method: string }>();

  selectedMethod: string = 'UPI';
  upiId: string = 'rahul.sharma@okaxis';
  isProcessing: boolean = false;

  confirmPayment(): void {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.paid.emit({
        invoiceId: this.invoice?.id || 'INV-2024-005',
        method: this.selectedMethod
      });
      this.close.emit();
    }, 750);
  }
}
