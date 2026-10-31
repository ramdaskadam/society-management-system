import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.css']
})
export class QuickActionsComponent {
  @Output() addMember = new EventEmitter<void>();
  @Output() addUnit = new EventEmitter<void>();
  @Output() createNotice = new EventEmitter<void>();
  @Output() bulkInvoice = new EventEmitter<void>();
  @Output() generateReport = new EventEmitter<void>();
  @Output() importPayments = new EventEmitter<void>();
}
