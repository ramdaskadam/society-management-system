import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './units-view.component.html',
  styleUrls: ['./units-view.component.css'],
  selector: 'app-units-view',
  standalone: true,
  imports: [CommonModule]
})
export class UnitsViewComponent {
  readonly state = inject(SocietyStateService);

  openAddUnit(): void {
    window.dispatchEvent(new CustomEvent('open-add-unit-modal'));
  }
}
