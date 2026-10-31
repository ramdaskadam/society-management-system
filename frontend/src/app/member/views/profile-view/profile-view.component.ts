import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';

@Component({
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule]
})
export class ProfileViewComponent {
  readonly state = inject(SocietyStateService);
  get user() { return this.state.memberUser(); }
}
