import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { Member } from '../../../models/society.model';

@Component({
  templateUrl: './members-view.component.html',
  styleUrls: ['./members-view.component.css'],
  selector: 'app-members-view',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MembersViewComponent {
  readonly state = inject(SocietyStateService);

  openAddMember(): void {
    window.dispatchEvent(new CustomEvent('open-add-member-modal'));
  }
}
