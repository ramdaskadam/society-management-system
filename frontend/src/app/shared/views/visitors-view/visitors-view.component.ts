import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { VisitorPass } from '../../../models/society.model';

@Component({
  selector: 'app-visitors-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './visitors-view.component.html',
  styleUrls: ['./visitors-view.component.css']
})
export class VisitorsViewComponent {
  readonly state = inject(SocietyStateService);

  statusFilter = 'All';
  showPreApproveForm = false;
  lastGeneratedPass: VisitorPass | null = null;

  // Form fields
  visitorName = '';
  visitorType: VisitorPass['visitorType'] = 'Guest';
  company = '';
  unitNo = this.state.currentResidentUnit();
  phone = '';
  expectedTime = 'Today, 08:00 PM';
  vehicleNo = '';

  get filteredVisitors(): VisitorPass[] {
    const base =
      this.state.currentUserRole() === 'member'
        ? this.state.activeUnitVisitors()
        : this.state.visitors();
    if (this.statusFilter === 'All') return base;
    return base.filter(v => v.status === this.statusFilter);
  }

  get insideCount(): number {
    return this.state.visitors().filter(v => v.status === 'Inside Premises').length;
  }

  get preApprovedCount(): number {
    return this.state.visitors().filter(v => v.status === 'Pre-Approved').length;
  }

  get waitingCount(): number {
    return this.state.visitors().filter(v => v.status === 'Waiting Approval').length;
  }

  onSubmitPreApprove(): void {
    if (!this.visitorName.trim() || !this.phone.trim()) return;
    const targetUnit =
      this.state.currentUserRole() === 'member'
        ? this.state.currentResidentUnit()
        : this.unitNo;
    this.lastGeneratedPass = this.state.preApproveVisitor({
      visitorName: this.visitorName.trim(),
      visitorType: this.visitorType,
      company: this.company.trim() || this.visitorType,
      unitNo: targetUnit,
      phone: this.phone.trim(),
      expectedTime: this.expectedTime.trim() || 'Today',
      vehicleNo: this.vehicleNo.trim() || undefined
    });
    this.visitorName = '';
    this.company = '';
    this.phone = '';
    this.vehicleNo = '';
    this.showPreApproveForm = false;
  }

  updateStatus(id: string, status: VisitorPass['status']): void {
    this.state.updateVisitorStatus(id, status);
  }
}
