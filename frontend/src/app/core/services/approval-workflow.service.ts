import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  ApprovalProcessConfig,
  ApprovalProcessType,
  CommitteeAdminMember,
  GovernanceApprovalRequest
} from '../../models/society.model';
import { SocietyStateService } from '../../services/society-state.service';

const STORAGE_KEY = 'sms_governance_approvals_v1';

const DEFAULT_COMMITTEE_ADMINS: CommitteeAdminMember[] = [
  {
    id: 'CA-01',
    name: 'Rahul Sharma',
    unit: 'A-101',
    designation: 'Hon. Secretary',
    email: 'rahul.sharma@example.com'
  },
  {
    id: 'CA-02',
    name: 'Suresh Patel',
    unit: 'B-202',
    designation: 'Hon. Treasurer',
    email: 'suresh.patel@example.com'
  },
  {
    id: 'CA-03',
    name: 'Ananya Deshmukh',
    unit: 'B-101',
    designation: 'Chairman',
    email: 'ananya.d@example.com'
  },
  {
    id: 'CA-04',
    name: 'Amitabh Sengupta',
    unit: 'D-101',
    designation: 'Vigilance & Legal Admin',
    email: 'a.sengupta@example.com'
  }
];

const DEFAULT_PROCESS_CONFIGS: ApprovalProcessConfig[] = [
  {
    processType: 'UNIT_OWNERSHIP_TRANSFER',
    title: 'Apartment Assignment & Ownership Transfer',
    description: 'Assigning a flat to a respective owner, NOC issuance, or share certificate transfer.',
    categoryBadge: 'Ownership & Transfer',
    requiresApproval: true,
    requiredApprovals: 2,
    slaHours: 48
  },
  {
    processType: 'EXPENSE_SANCTION',
    title: 'Society Expense & Vendor Payout Sanction',
    description: 'Approving vendor bills, sinking fund withdrawals, and capital/operational expenditures.',
    categoryBadge: 'Finance & Expense',
    requiresApproval: true,
    requiredApprovals: 3,
    slaHours: 24
  },
  {
    processType: 'SENSITIVE_DOC_SHARING',
    title: 'Sharing Sensitive Documents & Account Details',
    description: 'Releasing statutory audit reports, bank statements, or confidential member/account records.',
    categoryBadge: 'Data & Compliance',
    requiresApproval: true,
    requiredApprovals: 2,
    slaHours: 24
  },
  {
    processType: 'LEGAL_NOTICE_CASCADE',
    title: 'Cascading Legal Notices & Recovery Actions',
    description: 'Issuing formal legal notices, chronic defaulter recovery filings, or statutory directives.',
    categoryBadge: 'Legal & Statutory',
    requiresApproval: true,
    requiredApprovals: 3,
    slaHours: 48
  },
  {
    processType: 'EMERGENCY_REPAIR_CONTRACT',
    title: 'Major Infrastructure & Repair Contracts',
    description: 'Awarding civil waterproofing, elevator modernization, or CCTV/solar AMC contracts.',
    categoryBadge: 'Infrastructure',
    requiresApproval: true,
    requiredApprovals: 2,
    slaHours: 72
  },
  {
    processType: 'BYLAW_RATE_REVISION',
    title: 'Maintenance Rate & Society Bylaw Revision',
    description: 'Revising per-sq.ft maintenance charges, late fee interest, or society governance rules.',
    categoryBadge: 'Governance',
    requiresApproval: false,
    requiredApprovals: 3,
    slaHours: 72
  }
];

const DEFAULT_REQUESTS: GovernanceApprovalRequest[] = [
  {
    id: 'APR-2026-01',
    processType: 'UNIT_OWNERSHIP_TRANSFER',
    title: 'Flat A-201 Ownership Transfer & Share Certificate Endorsement',
    summary:
      'Assign Flat A-201 (Wing A, 3 BHK) ownership from Rajesh Kulkarni toFarhan Qureshi following registered sale deed verification and no-dues clearance.',
    priority: 'High',
    requestedBy: 'Rahul Sharma',
    requestedByUnit: 'A-101',
    requestedOn: '04 Nov 2026',
    requiredApprovals: 2,
    status: 'Pending',
    metadata: {
      unitNo: 'A-201',
      previousOwner: 'Rajesh Kulkarni',
      newOwner: 'Farhan Qureshi'
    },
    decisions: [
      {
        adminId: 'CA-01',
        adminName: 'Rahul Sharma',
        designation: 'Hon. Secretary',
        unit: 'A-101',
        decision: 'Approved',
        remark: 'Sale deed Index-II and maintenance clearance verified.',
        timestamp: '04 Nov 2026, 11:20 AM'
      }
    ]
  },
  {
    id: 'APR-2026-02',
    processType: 'EXPENSE_SANCTION',
    title: 'Wing A & B Terrace Waterproofing & Sump Pump Overhaul',
    summary:
      'Sanction disbursement of ₹1,85,000 from the Sinking Fund to Apex Civil Contractors as per comparative quotation review.',
    priority: 'High',
    requestedBy: 'Suresh Patel',
    requestedByUnit: 'B-202',
    requestedOn: '04 Nov 2026',
    requiredApprovals: 3,
    status: 'Pending',
    metadata: {
      amount: 185000,
      vendorName: 'Apex Civil Contractors Pvt. Ltd.'
    },
    decisions: [
      {
        adminId: 'CA-02',
        adminName: 'Suresh Patel',
        designation: 'Hon. Treasurer',
        unit: 'B-202',
        decision: 'Approved',
        remark: 'Budget available under FY26 Sinking Fund head; 3 quotes attached.',
        timestamp: '04 Nov 2026, 02:15 PM'
      },
      {
        adminId: 'CA-03',
        adminName: 'Ananya Deshmukh',
        designation: 'Chairman',
        unit: 'B-101',
        decision: 'Approved',
        remark: 'Inspected Wing A terrace seepage; work is urgent before monsoon.',
        timestamp: '05 Nov 2026, 09:40 AM'
      }
    ]
  },
  {
    id: 'APR-2026-03',
    processType: 'SENSITIVE_DOC_SHARING',
    title: 'Release FY 2025-26 Bank Reconciliation & Defaulter Ledger to Statutory Auditor',
    summary:
      'Authorize sharing sensitive society bank account statements (SBI A/c ****4821) and unit-wise arrears ledger with M/s Kulkarni & Associates (Statutory Auditors).',
    priority: 'Normal',
    requestedBy: 'Suresh Patel',
    requestedByUnit: 'B-202',
    requestedOn: '05 Nov 2026',
    requiredApprovals: 2,
    status: 'Pending',
    metadata: {
      documentTitle: 'FY 2025-26 Bank Statements & Arrears Ledger (Confidential)',
      recipientScope: 'Statutory Auditor & Co-op Registrar'
    },
    decisions: [
      {
        adminId: 'CA-02',
        adminName: 'Suresh Patel',
        designation: 'Hon. Treasurer',
        unit: 'B-202',
        decision: 'Approved',
        remark: 'Redacted personal KYC IDs; ready for statutory audit.',
        timestamp: '05 Nov 2026, 10:05 AM'
      }
    ]
  },
  {
    id: 'APR-2026-04',
    processType: 'LEGAL_NOTICE_CASCADE',
    title: 'Cascade MCS Act Section 101 Final Recovery Notice for Chronic Arrears',
    summary:
      'Approve cascading formal legal recovery notice to units exceeding 180 days of maintenance default and publish statutory compliance circular.',
    priority: 'Critical',
    requestedBy: 'Amitabh Sengupta',
    requestedByUnit: 'D-101',
    requestedOn: '05 Nov 2026',
    requiredApprovals: 3,
    status: 'Pending',
    metadata: {
      legalRef: 'LEGAL/MCS-101/2026/09'
    },
    decisions: [
      {
        adminId: 'CA-04',
        adminName: 'Amitabh Sengupta',
        designation: 'Vigilance & Legal Admin',
        unit: 'D-101',
        decision: 'Approved',
        remark: 'Draft vetted by society legal counsel.',
        timestamp: '05 Nov 2026, 01:30 PM'
      },
      {
        adminId: 'CA-03',
        adminName: 'Ananya Deshmukh',
        designation: 'Chairman',
        unit: 'B-101',
        decision: 'Approved',
        remark: 'Three prior reminders were already served.',
        timestamp: '05 Nov 2026, 03:10 PM'
      }
    ]
  },
  {
    id: 'APR-2026-00',
    processType: 'EMERGENCY_REPAIR_CONTRACT',
    title: 'Main Gate Boom Barrier & ANPR Camera Replacement',
    summary: 'Approved ₹64,000 emergency replacement of Gate-1 RFID boom barrier controller.',
    priority: 'High',
    requestedBy: 'Rahul Sharma',
    requestedByUnit: 'A-101',
    requestedOn: '28 Oct 2026',
    requiredApprovals: 2,
    status: 'Approved',
    executedOn: '29 Oct 2026',
    metadata: {
      amount: 64000,
      vendorName: 'SecureGate Automation LLP'
    },
    decisions: [
      {
        adminId: 'CA-01',
        adminName: 'Rahul Sharma',
        designation: 'Hon. Secretary',
        unit: 'A-101',
        decision: 'Approved',
        remark: 'Gate security priority.',
        timestamp: '28 Oct 2026, 04:00 PM'
      },
      {
        adminId: 'CA-03',
        adminName: 'Ananya Deshmukh',
        designation: 'Chairman',
        unit: 'B-101',
        decision: 'Approved',
        remark: 'Approved for immediate execution.',
        timestamp: '29 Oct 2026, 09:15 AM'
      }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class ApprovalWorkflowService {
  private readonly state = inject(SocietyStateService);

  readonly committeeAdmins = signal<CommitteeAdminMember[]>(DEFAULT_COMMITTEE_ADMINS);
  readonly processConfigs = signal<ApprovalProcessConfig[]>(DEFAULT_PROCESS_CONFIGS);
  readonly requests = signal<GovernanceApprovalRequest[]>(DEFAULT_REQUESTS);

  /** Which Committee Admin is currently acting in the Admin Portal (switchable to test multi-admin sign-off). */
  readonly activeAdminId = signal<string>(DEFAULT_COMMITTEE_ADMINS[0].id);

  readonly activeCommitteeAdmin = computed<CommitteeAdminMember>(
    () => this.committeeAdmins().find(a => a.id === this.activeAdminId()) ?? this.committeeAdmins()[0]
  );

  /** Count of pending multi-admin requests (shown as a badge in the sidebar). */
  readonly pendingCount = computed(
    () => this.requests().filter(r => r.status === 'Pending').length
  );

  constructor() {
    this.loadFromStorage();
    effect(() => {
      this.saveToStorage();
    });
  }

  getConfig(processType: ApprovalProcessType): ApprovalProcessConfig {
    return (
      this.processConfigs().find(c => c.processType === processType) ?? DEFAULT_PROCESS_CONFIGS[0]
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

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.committeeAdmins?.length) this.committeeAdmins.set(parsed.committeeAdmins);
      if (parsed.processConfigs?.length) this.processConfigs.set(parsed.processConfigs);
      if (parsed.requests?.length) this.requests.set(parsed.requests);
    } catch {
      /* ignore */
    }
  }
}
