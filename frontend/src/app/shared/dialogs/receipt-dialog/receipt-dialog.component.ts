import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice, Society } from '../../../models/society.model';

@Component({
  templateUrl: './receipt-dialog.component.html',
  styleUrls: ['./receipt-dialog.component.css'],
  selector: 'app-receipt-dialog',
  standalone: true,
  imports: [CommonModule]
})
export class ReceiptDialogComponent {
  @Input() isOpen = false;
  @Input() invoice: Invoice | null = null;
  @Input() society: Society = {
    name: 'Green Meadows',
    fullName: 'Green Meadows Co-operative Housing Society Ltd.',
    regNo: 'MH/MUM/HSG/2018/1429',
    address: 'Plot 42, Palm Beach Road, Sector 19, Sanpada, Navi Mumbai - 400705',
    totalWings: 4,
    totalUnits: 128,
    occupiedUnits: 128,
    totalMembers: 256,
    maintenancePerSqFt: 3.5,
    lateFeePercentage: 18,
    currency: '₹'
  };
  @Output() close = new EventEmitter<void>();

  printReceipt(): void {
    window.print();
  }
}
