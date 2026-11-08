import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Unit } from '../../../models/society.model';

export interface UnitFormSubmitPayload {
  editId?: string;
  unitNo: string;
  wing: string;
  floor: number;
  type: string;
  area: number;
  owner: string;
  occupancy: string;
}

/**
 * Add / Update Unit & Assign Owner Dialog.
 * - Owner is selected from a dropdown of registered society owners (`owners`).
 * - Supports both creating a new unit (`editUnit === null`) and updating an existing unit /
 *   assigning a flat to a respective owner (`editUnit !== null`).
 * - When editing a unit that has `pastOwners`, displays read-only Past Owner details.
 */
@Component({
  templateUrl: './add-unit-dialog.component.html',
  styleUrls: ['./add-unit-dialog.component.css'],
  selector: 'app-add-unit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AddUnitDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() editUnit: Unit | null = null;
  @Input() owners: string[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<UnitFormSubmitPayload>();

  unitNo = '';
  wing = 'A';
  floor = 1;
  type = '3 BHK';
  area = 1450;
  owner = '';
  occupancy = 'Owner Occupied';

  readonly error = signal('');

  ngOnChanges(): void {
    if (!this.isOpen) return;
    this.error.set('');
    if (this.editUnit) {
      this.unitNo = this.editUnit.unitNo;
      this.wing = this.editUnit.wing;
      this.floor = this.editUnit.floor;
      this.type = this.editUnit.type;
      this.area = this.editUnit.area;
      this.owner = this.editUnit.owner;
      this.occupancy = this.editUnit.occupancy || 'Owner Occupied';
    } else {
      this.unitNo = '';
      this.wing = 'A';
      this.floor = 1;
      this.type = '3 BHK';
      this.area = 1450;
      this.owner = this.owners[0] ?? '';
      this.occupancy = 'Owner Occupied';
    }
  }

  submitUnit(): void {
    if (!this.unitNo.trim() || !this.owner.trim()) {
      this.error.set('Please provide a unit number and select an owner from the dropdown.');
      return;
    }
    this.submit.emit({
      editId: this.editUnit?.id,
      unitNo: this.unitNo.trim().toUpperCase(),
      wing: this.wing,
      floor: Number(this.floor) || 1,
      type: this.type,
      area: Number(this.area) || 1200,
      owner: this.owner,
      occupancy: this.occupancy
    });
    this.close.emit();
  }
}
