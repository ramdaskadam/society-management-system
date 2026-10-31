import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './reports-view.component.html',
  styleUrls: ['./reports-view.component.css'],
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule]
})
export class ReportsViewComponent {
  readonly state = inject(SocietyStateService);
}
