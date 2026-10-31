import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: './book-amenity-dialog.component.html',
  styleUrls: ['./book-amenity-dialog.component.css'],
  selector: 'app-book-amenity-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class BookAmenityDialogComponent {
  @Input() isOpen = false;
  @Input() set selectedAmenity(val: string) {
    if (val) this.amenity = val;
  }
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ amenity: string; date: string; time: string; purpose: string }>();

  amenity = 'Community Hall';
  date = '2024-06-15';
  slot = '06:00 PM - 10:00 PM';
  purpose = '';

  submitBooking(): void {
    if (!this.purpose.trim()) {
      alert('Please enter a purpose for the reservation.');
      return;
    }
    this.submit.emit({
      amenity: this.amenity,
      date: this.date,
      time: this.slot,
      purpose: this.purpose
    });
    this.purpose = '';
    this.close.emit();
  }
}
