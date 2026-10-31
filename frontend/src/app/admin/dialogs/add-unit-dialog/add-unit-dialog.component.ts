import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: './add-unit-dialog.component.html',
  styleUrls: ['./add-unit-dialog.component.css'],
  selector: 'app-add-unit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AddUnitDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ unitNo: string; wing: string; type: string; area: number; owner: string }>();

  unitNo = '';
  wing = 'A';
  type = '3 BHK';
  area = 1450;
  owner = '';

  submitUnit(): void {
    if (!this.unitNo.trim() || !this.owner.trim()) {
      alert('Please fill out unit number and owner name.');
      return;
    }
    this.submit.emit({
      unitNo: this.unitNo,
      wing: this.wing,
      type: this.type,
      area: this.area,
      owner: this.owner
    });
    this.unitNo = '';
    this.owner = '';
    this.close.emit();
  }
}
