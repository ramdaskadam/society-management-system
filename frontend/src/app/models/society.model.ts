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
  type: 'payment' | 'complaint' | 'notice' | 'amenity';
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
  unit: string;
  wing: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  dues: number;
}

export interface Unit {
  id: string;
  unitNo: string;
  wing: string;
  floor: number;
  type: string;
  area: number;
  owner: string;
  tenant?: string;
  occupancy: string;
  dues: number;
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
