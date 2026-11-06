import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { ChartCollectionComponent } from '../../../shared/components/chart-collection/chart-collection.component';
import { ChartComplaintsComponent } from '../../../shared/components/chart-complaints/chart-complaints.component';
import { RecentActivitiesComponent } from '../../../shared/components/recent-activities/recent-activities.component';
import { QuickActionsComponent } from '../../../shared/components/quick-actions/quick-actions.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StatCardComponent,
    ChartCollectionComponent,
    ChartComplaintsComponent,
    RecentActivitiesComponent,
    QuickActionsComponent,
    TranslatePipe
  ]
})
export class AdminDashboardComponent {
  readonly state = inject(SocietyStateService);
  private readonly dialogs = inject(DialogModalService);

  navigateTo(view: string): void {
    this.state.setView(view);
  }

  openNoticeDialog(): void {
    this.dialogs.openNoticeModal();
  }

  openAddMember(): void {
    this.dialogs.openAddMemberModal();
  }

  openAddUnit(): void {
    this.dialogs.openAddUnitModal();
  }

  openBulkInvoice(): void {
    this.dialogs.openBulkInvoiceModal();
  }

  exportReport(): void {
    this.state.exportCsv('collections');
  }

  importPayments(): void {
    this.state.showToast('msg.bankImported', 'success', { count: 14 });
  }
}
