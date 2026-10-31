import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartCollectionComponent } from '../../../shared/components/chart-collection/chart-collection.component';
import { ChartComplaintsComponent } from '../../../shared/components/chart-complaints/chart-complaints.component';
import { RecentActivitiesComponent } from '../../../shared/components/recent-activities/recent-activities.component';
import { QuickActionsComponent } from '../../../shared/components/quick-actions/quick-actions.component';

@Component({
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatCardComponent,
    ChartCollectionComponent,
    ChartComplaintsComponent,
    RecentActivitiesComponent,
    QuickActionsComponent
  ]
})
export class AdminDashboardComponent {
  readonly state = inject(SocietyStateService);

  navigateTo(view: string): void {
    this.state.setView(view);
  }

  openNoticeDialog(): void {
    window.dispatchEvent(new CustomEvent('open-notice-modal'));
  }

  openAddMember(): void {
    window.dispatchEvent(new CustomEvent('open-add-member-modal'));
  }

  openAddUnit(): void {
    window.dispatchEvent(new CustomEvent('open-add-unit-modal'));
  }

  openBulkInvoice(): void {
    window.dispatchEvent(new CustomEvent('open-bulk-invoice-modal'));
  }

  exportReport(): void {
    this.state.exportCsv('collections');
  }

  importPayments(): void {
    this.state.showToast('Imported bank statement feed: 14 entries reconciled!', 'success');
  }
}
