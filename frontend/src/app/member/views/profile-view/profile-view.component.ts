import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SocietyStateService } from '../../../services/society-state.service';
import { FamilyMember } from '../../../models/society.model';
import { PersonDialogComponent, PersonFormResult } from '../../../shared/dialogs/person-dialog/person-dialog.component';

/**
 * Resident profile + household.
 * Flow: primary member edits own details (dialog, 'primary' mode) and manages family
 * (dialog, 'family' mode: add / edit / remove). All writes go through SocietyStateService,
 * so swapping its methods for REST calls is the only change needed when the backend lands.
 */
@Component({
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css'],
  selector: 'app-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PersonDialogComponent]
})
export class ProfileViewComponent {
  readonly state = inject(SocietyStateService);
  get user() { return this.state.memberUser(); }

  /** Which dialog is open: own profile, family form, or none. */
  readonly dialog = signal<'none' | 'primary' | 'family'>('none');
  /** Family member being edited (null = adding a new one). */
  readonly editing = signal<FamilyMember | null>(null);
  /** Family member awaiting remove confirmation. */
  readonly confirmRemoveId = signal<string | null>(null);

  readonly dialogTitle = computed(() =>
    this.dialog() === 'primary' ? 'Update my details' : this.editing() ? 'Edit family member' : 'Add family member'
  );
  readonly dialogPerson = computed(() =>
    this.dialog() === 'primary' ? this.state.primaryProfile() : this.editing()
  );

  openPrimary(): void { this.dialog.set('primary'); }
  openAddFamily(): void { this.editing.set(null); this.dialog.set('family'); }
  openEditFamily(m: FamilyMember): void { this.editing.set(m); this.dialog.set('family'); }
  closeDialog(): void { this.dialog.set('none'); this.editing.set(null); }

  onSave(result: PersonFormResult): void {
    if (this.dialog() === 'primary') {
      this.state.updatePrimaryProfile(result.details);
    } else if (this.editing()) {
      this.state.updateFamilyMember(this.editing()!.id, result.details, result.relation);
    } else {
      this.state.addFamilyMember(result.details, result.relation);
    }
    this.closeDialog();
  }

  askRemove(id: string): void { this.confirmRemoveId.set(id); }
  cancelRemove(): void { this.confirmRemoveId.set(null); }
  confirmRemove(id: string): void {
    this.state.removeFamilyMember(id);
    this.confirmRemoveId.set(null);
  }

  /** Age in whole years from an ISO date of birth. */
  age(dob: string): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
    return a;
  }

  fullName(m: FamilyMember): string {
    return [m.firstName, m.middleName, m.lastName].filter(Boolean).join(' ');
  }
}
