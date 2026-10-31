import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { Booking } from '../../../models/society.model';

@Component({
  templateUrl: './amenities-view.component.html',
  styleUrls: ['./amenities-view.component.css'],
  selector: 'app-amenities-view',
  standalone: true,
  imports: [CommonModule]
})
export class AmenitiesViewComponent {
  readonly state = inject(SocietyStateService);

  openBookingModal(name: string): void {
    window.dispatchEvent(new CustomEvent('open-booking-modal', { detail: name }));
  }
}
