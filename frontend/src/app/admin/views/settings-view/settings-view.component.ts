import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.css'],
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SettingsViewComponent {
  readonly state = inject(SocietyStateService);
  get society() { return this.state.society(); }
}
