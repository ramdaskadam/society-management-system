export type UserRole = 'admin' | 'member';

export interface Society {
  name: string;
  fullName: string;
  regNo: string;
  address: string;
  totalWings: number;
  totalUnits: number;
  occupiedUnits: number;
  totalMembers: number;
  maintenancePerSqFt: number;
  lateFeePercentage: number;
  currency: string;
}

export interface User {
  name: string;
  role: string;
  email: string;
  avatar: string;
  phone?: string;
  unit?: string;
  wing?: string;
  floor?: number;
  type?: string;
  area?: string;
  occupants?: number;
  vehicles?: string[];
}

export interface MetricStats {
  totalMembers: number;
  membersGrowth: string;
  totalUnits: number;
  unitsOccupancy: string;
  totalCollection: number;
  collectionGrowth: string;
  pendingDues: number;
  duesTrend: string;
  openComplaints: number;
  complaintsTrend: string;
}

export interface CollectionMonth {
  month: string;
  collected: number;
  pending: number;
}

export interface ComplaintStats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

export interface Activity {
  id: string;
  type: 'payment' | 'complaint' | 'notice' | 'amenity' | 'visitor' | 'poll';
  title: string;
  subtitle: string;
  amount?: string;
  time: string;
  timestamp: number;
  icon: string;
}

export interface Member {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  dob?: string;
  unit: string;
  wing: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  dues: number;
}

export interface PastOwnerRecord {
  id: string;
  ownerName: string;
  email?: string;
  phone?: string;
  fromDate: string;
  toDate: string;
}

export interface Unit {
  id: string;
  unitNo: string;
  wing: string;
  floor: number;
  type: string;
  area: number;
  owner: string;
  ownerSince?: string;
  tenant?: string;
  occupancy: string;
  dues: number;
  documentsVerified?: boolean;
  pastOwners?: PastOwnerRecord[];
}

export interface Invoice {
  id: string;
  unitNo: string;
  memberName: string;
  month: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  breakdown: {
    maintenance: number;
    sinkingFund: number;
    waterCharges: number;
    parkingCharge?: number;
    overduePenalty?: number;
  };
  status: 'Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';
  paidOn?: string;
  paymentMode?: string;
  txnId?: string;
}

export interface Payment {
  date: string;
  invoiceNo: string;
  unitNo: string;
  mode: string;
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
  txnId: string;
}

export interface Complaint {
  id: string;
  ticketNo: string;
  category: string;
  subject: string;
  description: string;
  unitNo: string;
  reportedBy: string;
  reportedOn: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  internalNote?: string;
  rating?: number;
}

export interface Notice {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  meetingDate?: string;
  location?: string;
  summary: string;
  pinned: boolean;
  author: string;
  attachment?: string | null;
}

export interface Amenity {
  id: string;
  name: string;
  capacity: string;
  charge: string;
  deposit: string;
  timings: string;
  available: boolean;
  description: string;
}

export interface Booking {
  id: string;
  amenity: string;
  date: string;
  time: string;
  bookedBy: string;
  unitNo: string;
  purpose: string;
  status: 'Confirmed' | 'Pending Approval' | 'Completed' | 'Cancelled';
  amount: string;
}

export interface SocietyDocument {
  id: string;
  title: string;
  category: string;
  size: string;
  date: string;
  access: string;
}

export interface AppNotification {
  id: string;
  title: string;
  text: string;
  time: string;
  read: boolean;
  type: 'billing' | 'notice' | 'complaint' | 'booking';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
}

export interface VisitorPass {
  id: string;
  passCode: string;
  visitorName: string;
  visitorType: 'Guest' | 'Delivery' | 'Cab' | 'Home Service';
  company?: string;
  unitNo: string;
  hostName: string;
  phone: string;
  expectedTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  vehicleNo?: string;
  status: 'Pre-Approved' | 'Waiting Approval' | 'Inside Premises' | 'Checked Out' | 'Denied';
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface SocietyPoll {
  id: string;
  title: string;
  description: string;
  category: 'Capital Expenditure' | 'Rule Amendment' | 'Committee Election' | 'Event Planning';
  createdBy: string;
  endDate: string;
  status: 'Active' | 'Closed';
  totalVotes: number;
  userVotedOptionId?: string | null;
  options: PollOption[];
}

export interface ParkingSlot {
  id: string;
  slotNo: string;
  wing: string;
  type: 'Covered Stilt' | 'Open Surface' | 'EV Charging Bay' | 'Visitor Bay';
  unitNo: string;
  ownerName: string;
  vehicleNo: string;
  vehicleType: '4-Wheeler' | '2-Wheeler';
  rfidTag: string;
  evEnabled: boolean;
  status: 'Allocated' | 'Vacant' | 'Occupied (Visitor)';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  module: 'Billing' | 'Security' | 'Complaints' | 'Notices' | 'Settings' | 'Governance' | 'Profile';
  details: string;
}

/** Personal details shared by the primary resident and their family members. */
export type Gender = 'Male' | 'Female' | 'Other';

export interface PersonDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  /** ISO date (yyyy-mm-dd). */
  dob: string;
  gender: Gender | '';
  /** Small JPEG data-URL (or image URL from the backend). */
  photo?: string;
  /** Optional. */
  qualification?: string;
  mobile?: string;
  email?: string;
  hasDisability: boolean;
  disabilityDetails?: string;
}

/** Secondary member of a flat, owned by the primary (verified) member. */
export interface FamilyMember extends PersonDetails {
  id: string;
  unitNo: string;
  relation: string;
  addedOn: string;
}

/** Tenant registered against a residential unit, along with their household family members. */
export interface TenantRecord extends PersonDetails {
  id: string;
  unitNo: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent?: number;
  policeVerified: boolean;
  status: 'Active' | 'Past';
  addedOn: string;
  familyMembers: FamilyMember[];
}

// ── Multi-Admin Governance & Process Approval Models ──────────────────────────
export type ApprovalProcessType =
  | 'UNIT_OWNERSHIP_TRANSFER'
  | 'EXPENSE_SANCTION'
  | 'SENSITIVE_DOC_SHARING'
  | 'LEGAL_NOTICE_CASCADE'
  | 'EMERGENCY_REPAIR_CONTRACT'
  | 'BYLAW_RATE_REVISION';

export interface CommitteeAdminMember {
  id: string;
  name: string;
  unit: string;
  designation: 'Chairman' | 'Hon. Secretary' | 'Hon. Treasurer' | 'Committee Admin' | 'Vigilance & Legal Admin';
  email: string;
}

export interface ApprovalProcessConfig {
  processType: ApprovalProcessType;
  title: string;
  description: string;
  categoryBadge: string;
  /** Configurable: whether initiating this process requires multi-admin committee quorum. */
  requiresApproval: boolean;
  /** Number of distinct committee admin approvals required to execute. */
  requiredApprovals: number;
  slaHours: number;
}

export interface ApprovalDecision {
  adminId: string;
  adminName: string;
  designation: string;
  unit: string;
  decision: 'Approved' | 'Rejected';
  remark: string;
  timestamp: string;
}

export interface GovernanceApprovalRequest {
  id: string;
  processType: ApprovalProcessType;
  title: string;
  summary: string;
  priority: 'Normal' | 'High' | 'Critical';
  requestedBy: string;
  requestedByUnit: string;
  requestedOn: string;
  requiredApprovals: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  metadata?: {
    unitNo?: string;
    newOwner?: string;
    previousOwner?: string;
    amount?: number;
    vendorName?: string;
    documentTitle?: string;
    recipientScope?: string;
    legalRef?: string;
  };
  decisions: ApprovalDecision[];
  executedOn?: string;
}
