import { ChangeDetectionStrategy, Component, computed, effect, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { DialogModalService } from '../../../core/services/dialog-modal.service';
import { AuthAccount, AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  templateUrl: './members-view.component.html',
  styleUrls: ['./members-view.component.css'],
  selector: 'app-members-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, TranslatePipe],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MembersViewComponent {
  readonly state = inject(SocietyStateService);
  readonly auth = inject(AuthService);
  private readonly dialogs = inject(DialogModalService);
  private readonly i18n = inject(I18nService);

  readonly searchQuery = signal('');
  readonly selectedWing = signal<string>('All');
  readonly selectedRole = signal<'All' | 'Owner' | 'Tenant'>('All');
  readonly duesFilter = signal<'All' | 'Pending' | 'Clear'>('All');

  /** Pending member registration awaiting Admin confirmation/rejection modal. */
  readonly pendingApprovalAction = signal<{ type: 'approve' | 'reject'; account: AuthAccount } | null>(null);

  readonly confirmTitle = computed(() => {
    const p = this.pendingApprovalAction();
    if (!p) return '';
    return p.type === 'approve'
      ? this.i18n.translate('approval.approveMemberConfirmTitle')
      : this.i18n.translate('approval.rejectBtn');
  });

  readonly confirmMessage = computed(() => {
    const p = this.pendingApprovalAction();
    if (!p) return '';
    const unit = p.account.unitNo || 'A-101';
    return p.type === 'approve'
      ? this.i18n.translate('approval.approveMemberConfirmMsg', { name: p.account.fullName, unit })
      : `Decline member registration request for ${p.account.fullName} (${unit})?`;
  });

  readonly wings = ['All', 'A', 'B', 'C', 'D'];

  constructor() {
    effect(
      () => {
        const globalQ = this.state.globalSearchQuery();
        if (globalQ !== undefined) {
          this.searchQuery.set(globalQ);
        }
      },
      { allowSignalWrites: true }
    );
  }

  readonly hasActiveFilters = computed(() =>
    this.searchQuery().trim().length > 0 ||
    this.selectedWing() !== 'All' ||
    this.selectedRole() !== 'All' ||
    this.duesFilter() !== 'All'
  );

  readonly filteredMembers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const wing = this.selectedWing();
    const role = this.selectedRole();
    const dues = this.duesFilter();

    return this.state.members().filter(m => {
      if (wing !== 'All' && m.wing !== wing) {
        return false;
      }
      if (role !== 'All' && m.role !== role) {
        return false;
      }
      if (dues === 'Pending' && m.dues <= 0) {
        return false;
      }
      if (dues === 'Clear' && m.dues > 0) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        `wing ${m.wing.toLowerCase()}`.includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      );
    });
  });

  askApproveMember(account: AuthAccount): void {
    this.pendingApprovalAction.set({ type: 'approve', account });
  }

  askRejectMember(account: AuthAccount): void {
    this.pendingApprovalAction.set({ type: 'reject', account });
  }

  cancelApprovalModal(): void {
    this.pendingApprovalAction.set(null);
  }

  executeApprovalModal(): void {
    const p = this.pendingApprovalAction();
    if (!p) return;
    if (p.type === 'approve') {
      this.auth.approveMemberAccount(p.account.username);
    } else {
      this.auth.rejectAccount(p.account.username);
    }
    this.pendingApprovalAction.set(null);
  }

  openAddMember(): void {
    this.dialogs.openAddMemberModal();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.state.clearGlobalSearch();
    this.selectedWing.set('All');
    this.selectedRole.set('All');
    this.duesFilter.set('All');
  }
}
