import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  templateUrl: './bulk-invoice-dialog.component.html',
  styleUrls: ['./bulk-invoice-dialog.component.css'],
  selector: 'app-bulk-invoice-dialog',
  standalone: true,
  imports: [CommonModule]
})
export class BulkInvoiceDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}
