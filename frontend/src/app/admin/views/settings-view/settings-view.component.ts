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

  fullName = this.state.society().fullName;
  address = this.state.society().address;
  maintenancePerSqFt = this.state.society().maintenancePerSqFt;
  lateFeePercentage = this.state.society().lateFeePercentage;

  get society() {
    return this.state.society();
  }

  saveSettings(): void {
    this.state.updateSocietySettings({
      fullName: this.fullName,
      address: this.address,
      maintenancePerSqFt: Number(this.maintenancePerSqFt) || 3.5,
      lateFeePercentage: Number(this.lateFeePercentage) || 18
    });
  }
}
