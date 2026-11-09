import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalWorkflowService } from '../../../core/services/approval-workflow.service';
import { SocietyStateService } from '../../../services/society-state.service';
import {
  ApprovalProcessConfig,
  ApprovalProcessType,
  CommitteeAdminMember,
  GovernanceApprovalRequest
} from '../../../models/society.model';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-approvals-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './approvals-view.component.html'
})
export class ApprovalsViewComponent {
  readonly workflow = inject(ApprovalWorkflowService);
  readonly state = inject(SocietyStateService);

  /** Active tab: 'queue' (Approval Requests) or 'policies' (Configure Process Policies & Committee Admins). */
  readonly activeTab = signal<'queue' | 'policies'>('queue');

  /** Filters for the Approval Queue. */
  readonly statusFilter = signal<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  readonly processFilter = signal<'All' | ApprovalProcessType>('All');

  /** Modal state for initiating a new process / approval request. */
  readonly showNewRequestModal = signal(false);

  // New Request Form Fields
  newProcessType: ApprovalProcessType = 'EXPENSE_SANCTION';
  newTitle = '';
  newSummary = '';
  newPriority: 'Normal' | 'High' | 'Critical' = 'High';
  newRequiresApproval = true;
  newRequiredApprovals = 2;
  newUnitNo = 'A-101';
  newOwnerName = '';
  newAmount: number | null = 50000;
  newVendorName = '';
  newDocumentTitle = '';
  newRecipientScope = 'Statutory Auditor & Committee';
  newLegalRef = '';
  newRemark = '';
  readonly formError = signal('');

  // Add Committee Admin Form Fields (in Policies tab)
  selectedMemberForAdmin = '';
  selectedDesignation: CommitteeAdminMember['designation'] = 'Committee Admin';

  /** Confirmation dialog state before approving or rejecting a request. */
  readonly pendingSignOff = signal<{
    request: GovernanceApprovalRequest;
    decision: 'Approved' | 'Rejected';
  } | null>(null);
  signOffRemark = '';

  readonly filteredRequests = computed(() => {
    const st = this.statusFilter();
    const pr = this.processFilter();
    return this.workflow.requests().filter(r => {
      if (st !== 'All' && r.status !== st) return false;
      if (pr !== 'All' && r.processType !== pr) return false;
      return true;
    });
  });

  /** Society members not yet in the Committee Admins list. */
  readonly eligibleMembersForAdmin = computed(() => {
    const existing = new Set(this.workflow.committeeAdmins().map(a => a.name.toLowerCase()));
    return this.state
      .members()
      .filter(m => !existing.has(m.name.toLowerCase()))
      .map(m => m.name);
  });

  readonly confirmModalTitle = computed(() => {
    const p = this.pendingSignOff();
    if (!p) return '';
    const admin = this.workflow.activeCommitteeAdmin();
    return p.decision === 'Approved'
      ? `Confirm Committee Sign-Off (${admin.name} • ${admin.designation})`
      : `Reject Governance Request (${admin.name})`;
  });

  readonly confirmModalMessage = computed(() => {
    const p = this.pendingSignOff();
    if (!p) return '';
    const approvedSoFar = this.approvedCount(p.request);
    const willExecute =
      p.decision === 'Approved' && approvedSoFar + 1 >= p.request.requiredApprovals;
    if (p.decision === 'Approved') {
      return willExecute
        ? `Approve "${p.request.title}"? This will reach the required quorum (${approvedSoFar + 1}/${p.request.requiredApprovals}) and automatically execute the process.`
        : `Record your committee approval for "${p.request.title}" (${approvedSoFar + 1}/${p.request.requiredApprovals} required approvals)?`;
    }
    return `Are you sure you want to reject "${p.request.title}"?`;
  });

  setTab(tab: 'queue' | 'policies'): void {
    this.activeTab.set(tab);
  }

  onProcessTypeChange(type: ApprovalProcessType): void {
    this.newProcessType = type;
    const cfg = this.workflow.getConfig(type);
    this.newRequiresApproval = cfg.requiresApproval;
    this.newRequiredApprovals = cfg.requiredApprovals;
    if (type === 'UNIT_OWNERSHIP_TRANSFER') {
      const units = this.state.units();
      this.newUnitNo = units[0]?.unitNo ?? 'A-101';
      this.newOwnerName = this.state.availableOwnerNames()[0] ?? '';
    }
  }

  openNewRequest(): void {
    this.formError.set('');
    this.onProcessTypeChange('EXPENSE_SANCTION');
    this.newTitle = '';
    this.newSummary = '';
    this.newRemark = '';
    this.showNewRequestModal.set(true);
  }

  closeNewRequest(): void {
    this.showNewRequestModal.set(false);
  }

  submitNewRequest(): void {
    if (!this.newTitle.trim() || !this.newSummary.trim()) {
      this.formError.set('Please enter both a request title and detailed process summary.');
      return;
    }

    const metadata: GovernanceApprovalRequest['metadata'] = {};
    if (this.newProcessType === 'UNIT_OWNERSHIP_TRANSFER') {
      const u = this.state.units().find(x => x.unitNo === this.newUnitNo);
      metadata.unitNo = this.newUnitNo;
      metadata.previousOwner = u?.owner ?? '';
      metadata.newOwner = this.newOwnerName;
    } else if (
      this.newProcessType === 'EXPENSE_SANCTION' ||
      this.newProcessType === 'EMERGENCY_REPAIR_CONTRACT'
    ) {
      metadata.amount = Number(this.newAmount) || 0;
      metadata.vendorName = this.newVendorName.trim() || 'Registered Society Vendor';
    } else if (this.newProcessType === 'SENSITIVE_DOC_SHARING') {
      metadata.documentTitle = this.newDocumentTitle.trim() || this.newTitle.trim();
      metadata.recipientScope = this.newRecipientScope.trim();
    } else if (this.newProcessType === 'LEGAL_NOTICE_CASCADE') {
      metadata.legalRef = this.newLegalRef.trim() || `LEGAL/${new Date().getFullYear()}/01`;
    }

    this.workflow.submitRequest({
      processType: this.newProcessType,
      title: this.newTitle,
      summary: this.newSummary,
      priority: this.newPriority,
      requiresApprovalOverride: this.newRequiresApproval,
      requiredApprovalsOverride: this.newRequiredApprovals,
      metadata,
      initialRemark: this.newRemark
    });

    this.showNewRequestModal.set(false);
    this.activeTab.set('queue');
  }

  approvedCount(req: GovernanceApprovalRequest): number {
    return req.decisions.filter(d => d.decision === 'Approved').length;
  }

  progressPercent(req: GovernanceApprovalRequest): number {
    if (!req.requiredApprovals) return 100;
    return Math.min(100, Math.round((this.approvedCount(req) / req.requiredApprovals) * 100));
  }

  hasCurrentAdminSigned(req: GovernanceApprovalRequest): boolean {
    const adminId = this.workflow.activeAdminId();
    return req.decisions.some(d => d.adminId === adminId);
  }

  processLabel(type: ApprovalProcessType): string {
    return this.workflow.getConfig(type).categoryBadge;
  }

  askDecision(request: GovernanceApprovalRequest, decision: 'Approved' | 'Rejected'): void {
    this.pendingSignOff.set({ request, decision });
  }

  cancelDecision(): void {
    this.pendingSignOff.set(null);
  }

  confirmDecision(): void {
    const p = this.pendingSignOff();
    if (!p) return;
    this.workflow.recordDecision(p.request.id, p.decision, this.signOffRemark);
    this.signOffRemark = '';
    this.pendingSignOff.set(null);
  }

  togglePolicyRequiresApproval(cfg: ApprovalProcessConfig, checked: boolean): void {
    this.workflow.updateProcessPolicy(cfg.processType, { requiresApproval: checked });
  }

  changePolicyQuorum(cfg: ApprovalProcessConfig, quorum: number): void {
    this.workflow.updateProcessPolicy(cfg.processType, { requiredApprovals: Number(quorum) });
  }

  addSelectedMemberAsAdmin(): void {
    if (!this.selectedMemberForAdmin) return;
    this.workflow.addCommitteeAdmin(this.selectedMemberForAdmin, this.selectedDesignation);
    this.selectedMemberForAdmin = '';
  }
}
