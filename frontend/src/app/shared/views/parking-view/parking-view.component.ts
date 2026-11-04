import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { ParkingSlot } from '../../../models/society.model';

@Component({
  selector: 'app-parking-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parking-view.component.html',
  styleUrls: ['./parking-view.component.css']
})
export class ParkingViewComponent {
  readonly state = inject(SocietyStateService);

  typeFilter = 'All';
  showRegisterForm = false;

  slotNo = 'EV-A101';
  wing = 'A';
  type: ParkingSlot['type'] = 'Covered Stilt';
  unitNo = 'A-101';
  ownerName = 'Rahul Sharma';
  vehicleNo = '';
  vehicleType: ParkingSlot['vehicleType'] = '4-Wheeler';
  evEnabled = false;

  get filteredSlots(): ParkingSlot[] {
    return this.state.parkingSlots().filter(s => {
      if (this.typeFilter !== 'All' && s.type !== this.typeFilter) return false;
      return true;
    });
  }

  get evBaysCount(): number {
    return this.state.parkingSlots().filter(s => s.evEnabled).length;
  }

  get allocatedCount(): number {
    return this.state.parkingSlots().filter(s => s.status === 'Allocated').length;
  }

  get visitorBaysAvailable(): number {
    return this.state.parkingSlots().filter(s => s.type === 'Visitor Bay' && s.status === 'Vacant').length;
  }

  onRegisterVehicle(): void {
    if (!this.vehicleNo.trim() || !this.slotNo.trim()) return;
    this.state.registerParkingVehicle({
      slotNo: this.slotNo.trim(),
      wing: this.wing,
      type: this.type,
      unitNo: this.unitNo.trim(),
      ownerName: this.ownerName.trim(),
      vehicleNo: this.vehicleNo.trim(),
      vehicleType: this.vehicleType,
      evEnabled: this.evEnabled || this.type === 'EV Charging Bay'
    });
    this.vehicleNo = '';
    this.showRegisterForm = false;
  }
}

