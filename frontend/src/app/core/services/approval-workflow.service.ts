import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  ApprovalProcessConfig,
  ApprovalProcessType,
  CommitteeAdminMember,
  GovernanceApprovalRequest
} from '../../models/society.model';
import { SocietyStateService } from '../../services/society-state.service';
import { SocietyApiService } from './society-api.service';
import governanceSeed from '../../../assets/mock-data/governance.json';

const STORAGE_KEY = 'sms_governance_approvals_v1';

const SEED_COMMITTEE_ADMINS = governanceSeed.committeeAdmins as CommitteeAdminMember[];
const SEED_PROCESS_CONFIGS = governanceSeed.processConfigs as ApprovalProcessConfig[];
const SEED_REQUESTS = governanceSeed.approvalRequests as GovernanceApprovalRequest[];

@Injectable({ providedIn: 'root' })
export class ApprovalWorkflowService {
  private readonly state = inject(SocietyStateService);
  private readonly api = inject(SocietyApiService, { optional: true });

  readonly committeeAdmins = signal<CommitteeAdminMember[]>(SEED_COMMITTEE_ADMINS);
  readonly processConfigs = signal<ApprovalProcessConfig[]>(SEED_PROCESS_CONFIGS);
  readonly requests = signal<GovernanceApprovalRequest[]>(SEED_REQUESTS);

  /** Which Committee Admin is currently acting in the Admin Portal (switchable to test multi-admin sign-off). */
  readonly activeAdminId = signal<string>(SEED_COMMITTEE_ADMINS[0]?.id ?? 'CA-01');

  readonly activeCommitteeAdmin = computed<CommitteeAdminMember>(
    () => this.committeeAdmins().find(a => a.id === this.activeAdminId()) ?? this.committeeAdmins()[0]
  );

  /** Count of pending multi-admin requests (shown as a badge in the sidebar). */
  readonly pendingCount = computed(
    () => this.requests().filter(r => r.status === 'Pending').length
  );

  constructor() {
    const hasCache = this.loadFromStorage();
    if (!hasCache) {
      this.hydrateFromMockJson();
    }
    effect(() => {
      this.saveToStorage();
    });
  }

  /** Fetches committee admins, process policies, and approval requests from `governance.json` via `SocietyApiService`. */
  hydrateFromMockJson(): void {
    this.api?.getGovernanceData().subscribe({
      next: data => {
        if (data.committeeAdmins?.length) {
          this.committeeAdmins.set(data.committeeAdmins);
          this.activeAdminId.set(data.committeeAdmins[0].id);
        }
        if (data.processConfigs?.length) {
          this.processConfigs.set(data.processConfigs);
        }
        if (data.approvalRequests?.length) {
          this.requests.set(data.approvalRequests);
        }
      }
    });
  }

  getConfig(processType: ApprovalProcessType): ApprovalProcessConfig {
    return (
      this.processConfigs().find(c => c.processType === processType) ?? SEED_PROCESS_CONFIGS[0]
    );
  }

  /** Toggle whether a process type requires multi-admin committee approval or executes immediately. */
  updateProcessPolicy(
    processType: ApprovalProcessType,
    patch: Partial<Pick<ApprovalProcessConfig, 'requiresApproval' | 'requiredApprovals' | 'slaHours'>>
  ): void {
    const maxAdmins = Math.max(1, this.committeeAdmins().length);
    this.processConfigs.update(list =>
      list.map(c => {
        if (c.processType !== processType) return c;
        const clampedQuorum =
          patch.requiredApprovals !== undefined
            ? Math.min(maxAdmins, Math.max(1, Number(patch.requiredApprovals)))
            : c.requiredApprovals;
        return { ...c, ...patch, requiredApprovals: clampedQuorum };
      })
    );
    const updated = this.getConfig(processType);
    this.state.logAudit(
      'Governance',
      `Updated approval policy for "${updated.title}": Requires Approval = ${updated.requiresApproval ? 'Yes' : 'No'}, Quorum = ${updated.requiredApprovals}.`
    );
    this.state.showToast('msg.policyUpdated', 'info', { process: updated.categoryBadge });
  }

  /** Promote a society member to a Committee Admin so they can participate in multi-admin approvals. */
  addCommitteeAdmin(memberName: string, designation: CommitteeAdminMember['designation']): void {
    const member = this.state.members().find(m => m.name === memberName);
    if (!member) return;
    if (this.committeeAdmins().some(a => a.name.toLowerCase() === member.name.toLowerCase())) {
      return;
    }
    const newAdmin: CommitteeAdminMember = {
      id: `CA-0${this.committeeAdmins().length + 1}-${Date.now().toString(36).slice(-2).toUpperCase()}`,
      name: member.name,
      unit: member.unit,
      designation,
      email: member.email
    };
    this.committeeAdmins.update(list => [...list, newAdmin]);
    this.state.logAudit('Governance', `Added ${member.name} (${member.unit}) as ${designation} in Committee Admins.`);
    this.state.showToast('msg.committeeUpdated', 'success');
  }

  removeCommitteeAdmin(adminId: string): void {
    if (this.committeeAdmins().length <= 2) return; // Keep at least 2 committee admins
    this.committeeAdmins.update(list => list.filter(a => a.id !== adminId));
    if (this.activeAdminId() === adminId) {
      this.activeAdminId.set(this.committeeAdmins()[0].id);
    }
    this.state.showToast('msg.committeeUpdated', 'info');
  }

  /**
   * Creates a new process request.
   * - If `forceApproval` (or the process config's `requiresApproval`) is true, queues it for multi-admin sign-off
   *   (with the initiating committee admin's first approval recorded).
   * - If `requiresApproval` is false (or quorum is 1), executes the process immediately!
   */
  submitRequest(data: {
    processType: ApprovalProcessType;
    title: string;
    summary: string;
    priority: 'Normal' | 'High' | 'Critical';
    requiresApprovalOverride?: boolean;
    requiredApprovalsOverride?: number;
    metadata?: GovernanceApprovalRequest['metadata'];
    initialRemark?: string;
  }): GovernanceApprovalRequest {
    const cfg = this.getConfig(data.processType);
    const actor = this.activeCommitteeAdmin();
    const needsApproval =
      data.requiresApprovalOverride !== undefined ? data.requiresApprovalOverride : cfg.requiresApproval;
    const quorum = needsApproval
      ? Math.max(1, data.requiredApprovalsOverride ?? cfg.requiredApprovals)
      : 1;

    const nowDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const req: GovernanceApprovalRequest = {
      id: `APR-${new Date().getFullYear()}-${String(this.requests().length + 1).padStart(2, '0')}`,
      processType: data.processType,
      title: data.title.trim(),
      summary: data.summary.trim(),
      priority: data.priority,
      requestedBy: actor.name,
      requestedByUnit: actor.unit,
      requestedOn: nowDate,
      requiredApprovals: quorum,
      status: quorum <= 1 ? 'Approved' : 'Pending',
      executedOn: quorum <= 1 ? nowDate : undefined,
      metadata: data.metadata,
      decisions: [
        {
          adminId: actor.id,
          adminName: actor.name,
          designation: actor.designation,
          unit: actor.unit,
          decision: 'Approved',
          remark: data.initialRemark?.trim() || 'Initiated and approved by proposer.',
          timestamp: `${nowDate}, ${nowTime}`
        }
      ]
    };

    this.requests.update(list => [req, ...list]);

    if (req.status === 'Approved') {
      this.executeApprovedAction(req);
      this.state.showToast('msg.approvalExecuted', 'success', { title: req.title });
    } else {
      this.state.logAudit(
        'Governance',
        `Submitted multi-admin approval request ${req.id}: "${req.title}" (1/${quorum} approved).`
      );
      this.state.showToast('msg.approvalCreated', 'info', { title: req.title });
    }
    return req;
  }

  /** Records a Committee Admin's Approval or Rejection on a pending request. */
  recordDecision(requestId: string, decision: 'Approved' | 'Rejected', remark: string): void {
    const actor = this.activeCommitteeAdmin();
    const target = this.requests().find(r => r.id === requestId);
    if (!target || target.status !== 'Pending') return;

    // Prevent duplicate sign-off by the same committee admin
    if (target.decisions.some(d => d.adminId === actor.id)) {
      return;
    }

    const nowDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedDecisions = [
      ...target.decisions,
      {
        adminId: actor.id,
        adminName: actor.name,
        designation: actor.designation,
        unit: actor.unit,
        decision,
        remark:
          remark.trim() ||
          (decision === 'Approved' ? 'Verified and approved.' : 'Declined after committee review.'),
        timestamp: `${nowDate}, ${nowTime}`
      }
    ];

    const approvedCount = updatedDecisions.filter(d => d.decision === 'Approved').length;
    const newStatus: GovernanceApprovalRequest['status'] =
      decision === 'Rejected'
        ? 'Rejected'
        : approvedCount >= target.requiredApprovals
          ? 'Approved'
          : 'Pending';

    const updatedReq: GovernanceApprovalRequest = {
      ...target,
      decisions: updatedDecisions,
      status: newStatus,
      executedOn: newStatus === 'Approved' ? nowDate : undefined
    };

    this.requests.update(list => list.map(r => (r.id === requestId ? updatedReq : r)));

    if (newStatus === 'Approved') {
      this.executeApprovedAction(updatedReq);
      this.state.logAudit(
        'Governance',
        `Quorum (${approvedCount}/${target.requiredApprovals}) reached for ${target.id} ("${target.title}"). Process auto-executed.`
      );
      this.state.showToast('msg.approvalExecuted', 'success', { title: target.title });
    } else if (newStatus === 'Rejected') {
      this.state.logAudit(
        'Governance',
        `Request ${target.id} ("${target.title}") rejected by ${actor.name} (${actor.designation}).`
      );
      this.state.showToast('msg.approvalRejected', 'warning', {
        title: target.title,
        admin: actor.name
      });
    } else {
      this.state.logAudit(
        'Governance',
        `${actor.name} (${actor.designation}) approved ${target.id} (${approvedCount}/${target.requiredApprovals}).`
      );
      this.state.showToast('msg.approvalRecorded', 'success', { admin: actor.name });
    }
  }

  /**
   * Automatically executes the domain side-effect in `SocietyStateService` once multi-admin quorum is met!
   */
  private executeApprovedAction(req: GovernanceApprovalRequest): void {
    const meta = req.metadata;
    if (req.processType === 'UNIT_OWNERSHIP_TRANSFER' && meta?.unitNo && meta?.newOwner) {
      const unit = this.state.units().find(u => u.unitNo.toUpperCase() === meta.unitNo!.toUpperCase());
      if (unit) {
        this.state.updateUnit(unit.id, {
          unitNo: unit.unitNo,
          wing: unit.wing,
          floor: unit.floor,
          type: unit.type,
          area: unit.area,
          owner: meta.newOwner,
          occupancy: unit.occupancy
        });
      }
    } else if (req.processType === 'LEGAL_NOTICE_CASCADE') {
      this.state.publishNotice({
        title: req.title,
        category: 'Legal & Statutory',
        location: 'Society Office',
        summary: `${req.summary}${meta?.legalRef ? ' [Ref: ' + meta.legalRef + ']' : ''}`,
        pinned: true
      });
    } else if (req.processType === 'SENSITIVE_DOC_SHARING' && meta?.documentTitle) {
      this.state.uploadDocument({
        title: meta.documentTitle,
        category: 'Audit & Confidential',
        access: meta.recipientScope || 'Managing Committee & Auditor'
      });
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          committeeAdmins: this.committeeAdmins(),
          processConfigs: this.processConfigs(),
          requests: this.requests()
        })
      );
    } catch {
      /* ignore */
    }
  }

  private loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed.committeeAdmins?.length) this.committeeAdmins.set(parsed.committeeAdmins);
      if (parsed.processConfigs?.length) this.processConfigs.set(parsed.processConfigs);
      if (parsed.requests?.length) this.requests.set(parsed.requests);
      return true;
    } catch {
      return false;
    }
  }
}
