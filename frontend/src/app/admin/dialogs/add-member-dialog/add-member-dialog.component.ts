import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  @Output() submit = new EventEmitter<{ name: string; unit: string; role: string; email: string; phone: string }>();

  name = '';
  unit = '';
  role = 'Owner';
  phone = '';
  email = '';

  submitMember(): void {
    if (!this.name.trim() || !this.unit.trim() || !this.phone.trim() || !this.email.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    this.submit.emit({
      name: this.name,
      unit: this.unit,
      role: this.role,
      phone: this.phone,
      email: this.email
    });
    this.name = '';
    this.unit = '';
    this.phone = '';
    this.email = '';
    this.close.emit();
  }
}
