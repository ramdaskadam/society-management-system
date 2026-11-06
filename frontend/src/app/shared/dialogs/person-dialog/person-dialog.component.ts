import { ChangeDetectionStrategy, Component, OnChanges, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FAMILY_RELATIONS, GENDERS, QUALIFICATION_SUGGESTIONS } from '../../../core/config/family.config';
import { Gender, PersonDetails } from '../../../models/society.model';
import { MOBILE_RE, normalizeMobile } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface PersonFormResult {
  details: PersonDetails;
  /** Only set in 'family' mode. */
  relation: string;
  /** Only set in 'tenant' mode. */
  lease?: {
    leaseStart: string;
    leaseEnd: string;
    monthlyRent?: number;
    policeVerified: boolean;
    status: 'Active' | 'Past';
  };
}

export type PersonDialogData = PersonDetails & {
  relation?: string;
  leaseStart?: string;
  leaseEnd?: string;
  monthlyRent?: number;
  policeVerified?: boolean;
  status?: 'Active' | 'Past';
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO_PX = 256;

/**
 * Reusable person form dialog, used for:
 *  - 'primary': primary member's own profile
 *  - 'family':  adding/editing family members (for either primary member or a tenant)
 *  - 'tenant':  adding/editing a tenant (includes lease dates, rent, police verification)
 */
@Component({
  selector: 'app-person-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './person-dialog.component.html'
})
export class PersonDialogComponent implements OnChanges {
  readonly isOpen = input(false);
  readonly mode = input<'primary' | 'family' | 'tenant'>('family');
  readonly title = input('');
  /** Existing values to edit; null/undefined means "new". */
  readonly person = input<PersonDialogData | null>(null);
  readonly close = output<void>();
  readonly save = output<PersonFormResult>();

  readonly relations = FAMILY_RELATIONS;
  readonly genders = GENDERS;
  readonly qualifications = QUALIFICATION_SUGGESTIONS;
  readonly today = new Date().toISOString().slice(0, 10);

  readonly error = signal('');
  readonly photo = signal<string | undefined>(undefined);

  firstName = '';
  middleName = '';
  lastName = '';
  dob = '';
  gender: Gender | '' = '';
  qualification = '';
  mobile = '';
  email = '';
  relation = '';
  hasDisability = false;
  disabilityDetails = '';

  // Tenant-only fields
  leaseStart = '';
  leaseEnd = '';
  monthlyRent: number | null = null;
  policeVerified = false;
  tenantStatus: 'Active' | 'Past' = 'Active';

  /** Loads the form from `person` every time the dialog is (re)opened. */
  ngOnChanges(): void {
    if (!this.isOpen()) return;
    const p = this.person();
    this.firstName = p?.firstName ?? '';
    this.middleName = p?.middleName ?? '';
    this.lastName = p?.lastName ?? '';
    this.dob = p?.dob ?? '';
    this.gender = p?.gender ?? '';
    this.qualification = p?.qualification ?? '';
    this.mobile = p?.mobile ?? '';
    this.email = p?.email ?? '';
    this.relation = p?.relation ?? '';
    this.hasDisability = p?.hasDisability ?? false;
    this.disabilityDetails = p?.disabilityDetails ?? '';
    this.leaseStart = p?.leaseStart ?? this.today;
    this.leaseEnd = p?.leaseEnd ?? '';
    this.monthlyRent = p?.monthlyRent ?? null;
    this.policeVerified = p?.policeVerified ?? false;
    this.tenantStatus = p?.status ?? 'Active';
    this.photo.set(p?.photo);
    this.error.set('');
  }

  /** Reads the chosen image and shrinks it so it stays small in storage / API payloads. */
  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.photo.set(canvas.toDataURL('image/jpeg', 0.85));
        this.error.set('');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photo.set(undefined);
  }

  submit(): void {
    const mode = this.mode();
    const requireContact = mode === 'primary' || mode === 'tenant';
    const mobile = normalizeMobile(this.mobile);
    const email = this.email.trim().toLowerCase();

    if (!this.firstName.trim() || !this.lastName.trim()) return this.fail('First name and last name are required.');
    if (!this.dob || this.dob > this.today) return this.fail('Enter a valid date of birth (not in the future).');
    if (!this.gender) return this.fail('Select a gender.');
    if (mode === 'family' && !this.relation) return this.fail('Select the relationship.');
    if ((requireContact || this.mobile.trim()) && !MOBILE_RE.test(mobile)) return this.fail('Enter a valid 10-digit mobile number.');
    if ((requireContact || email) && !EMAIL_RE.test(email)) return this.fail('Enter a valid email address.');
    if (mode === 'tenant') {
      if (!this.leaseStart || !this.leaseEnd) return this.fail('Enter both lease start and lease end dates.');
      if (this.leaseEnd < this.leaseStart) return this.fail('Lease end date must be after lease start date.');
    }
    if (this.hasDisability && !this.disabilityDetails.trim()) return this.fail('Please describe the disability.');

    this.save.emit({
      relation: this.relation,
      details: {
        firstName: this.firstName.trim(),
        middleName: this.middleName.trim(),
        lastName: this.lastName.trim(),
        dob: this.dob,
        gender: this.gender,
        photo: this.photo(),
        qualification: this.qualification.trim(),
        mobile: this.mobile.trim() ? mobile : '',
        email,
        hasDisability: this.hasDisability,
        disabilityDetails: this.hasDisability ? this.disabilityDetails.trim() : ''
      },
      lease:
        mode === 'tenant'
          ? {
              leaseStart: this.leaseStart,
              leaseEnd: this.leaseEnd,
              monthlyRent: this.monthlyRent && this.monthlyRent > 0 ? Number(this.monthlyRent) : undefined,
              policeVerified: this.policeVerified,
              status: this.tenantStatus
            }
          : undefined
    });
  }

  private fail(message: string): void {
    this.error.set(message);
  }
}
