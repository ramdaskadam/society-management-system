import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AddMemberSubmitPayload {
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  role: string;
  email: string;
  phone: string;
}

@Component({
  templateUrl: './add-member-dialog.component.html',
  styleUrls: ['./add-member-dialog.component.css'],
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AddMemberDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<AddMemberSubmitPayload>();

  firstName = '';
  middleName = '';
  lastName = '';
  gender: 'Male' | 'Female' | 'Other' | '' = '';
  dob = '';
  role = 'Owner';
  phone = '';
  email = '';
  readonly todayIso = new Date().toISOString().slice(0, 10);
  readonly formError = signal('');

  submitMember(): void {
    const first = this.firstName.trim();
    const middle = this.middleName.trim();
    const last = this.lastName.trim();
    const phone = this.phone.trim();
    const email = this.email.trim();

    if (!first || !last || !this.gender || !phone || !email) {
      this.formError.set('Please fill out First Name, Last Name, Gender, Phone Number, and Email Address.');
      return;
    }

    const fullName = [first, middle, last].filter(Boolean).join(' ');
    this.formError.set('');
    this.submit.emit({
      firstName: first,
      middleName: middle,
      lastName: last,
      name: fullName,
      gender: this.gender,
      dob: this.dob,
      role: this.role,
      phone,
      email
    });

    this.firstName = '';
    this.middleName = '';
    this.lastName = '';
    this.gender = '';
    this.dob = '';
    this.role = 'Owner';
    this.phone = '';
    this.email = '';
    this.close.emit();
  }
}
