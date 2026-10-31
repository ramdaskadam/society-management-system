import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Society,
  User,
  UserRole,
  MetricStats,
  CollectionMonth,
  ComplaintStats,
  Activity,
  Member,
  Unit,
  Invoice,
  Payment,
  Complaint,
  Notice,
  Amenity,
  Booking,
  SocietyDocument,
  AppNotification,
  ToastMessage
} from '../models/society.model';

const STORAGE_KEY = 'green_meadows_sms_angular_v1';

const INITIAL_SOCIETY: Society = {
  name: 'Green Meadows',
  fullName: 'Green Meadows Co-operative Housing Society Ltd.',
  regNo: 'MH/MUM/HSG/2018/1429',
  address: 'Plot 42, Palm Beach Road, Sector 19, Sanpada, Navi Mumbai - 400705',
  totalWings: 4,
  totalUnits: 128,
  occupiedUnits: 128,
  totalMembers: 256,
  maintenancePerSqFt: 3.5,
  lateFeePercentage: 18,
  currency: '₹'
};

const INITIAL_ADMIN: User = {
  name: 'Admin User',
  role: 'Super Admin',
  email: 'admin@greenmeadows.org',
  avatar: '/assets/admin_avatar.jpg'
};

const INITIAL_MEMBER: User = {
  name: 'Rahul Sharma',
  role: 'Flat Owner',
  email: 'rahul.sharma@example.com',
  phone: '+91 98201 44521',
  unit: 'A-101',
  wing: 'A',
  floor: 1,
  type: '3 BHK',
  area: '1450 sq.ft',
  occupants: 3,
  avatar: '/assets/resident_avatar.jpg',
  vehicles: ['MH-02-CB-4521 (Car)', 'MH-02-EE-1122 (Two-wheeler)']
};

const INITIAL_METRICS: MetricStats = {
  totalMembers: 256,
  membersGrowth: '+8 this month',
  totalUnits: 128,
  unitsOccupancy: '100% Occupied',
  totalCollection: 845320,
  collectionGrowth: '+12.5% from last month',
  pendingDues: 235760,
  duesTrend: '-8.2% from last month',
  openComplaints: 12,
  complaintsTrend: '-3 from last week'
};

const INITIAL_COLLECTION: CollectionMonth[] = [
  { month: 'Dec', collected: 500000, pending: 220000 },
  { month: 'Jan', collected: 620000, pending: 380000 },
  { month: 'Feb', collected: 710000, pending: 420000 },
  { month: 'Mar', collected: 810000, pending: 650000 },
  { month: 'Apr', collected: 730000, pending: 460000 },
  { month: 'May', collected: 845320, pending: 235760 }
];

const INITIAL_COMPLAINT_STATS: ComplaintStats = {
  open: 12,
  inProgress: 6,
  resolved: 5,
  closed: 1,
  total: 24
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'payment',
    title: 'Payment received from A-101',
    subtitle: 'Maintenance Dues for May 2024',
    amount: '₹5,000',
    time: '2 mins ago',
    timestamp: Date.now() - 2 * 60 * 1000,
    icon: 'payment'
  },
  {
    id: 'act-2',
    type: 'complaint',
    title: 'New complaint #C-24 reported',
    subtitle: 'Water leakage in Block A duct',
    time: '15 mins ago',
    timestamp: Date.now() - 15 * 60 * 1000,
    icon: 'alert'
  },
  {
    id: 'act-3',
    type: 'notice',
    title: 'Notice published',
    subtitle: 'Society Annual General Meeting on 25 May',
    time: '1 hour ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    icon: 'megaphone'
  },
  {
    id: 'act-4',
    type: 'amenity',
    title: 'Amenity booked',
    subtitle: 'Community Hall by Rahul Sharma (A-101)',
    time: '2 hours ago',
    timestamp: Date.now() - 120 * 60 * 1000,
    icon: 'calendar'
  }
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'M-101', name: 'Rahul Sharma', unit: 'A-101', wing: 'A', role: 'Owner', email: 'rahul.sharma@example.com', phone: '+91 98201 44521', status: 'Active', dues: 7500 },
  { id: 'M-102', name: 'Priya Iyer', unit: 'A-102', wing: 'A', role: 'Owner', email: 'priya.iyer@example.com', phone: '+91 98203 12908', status: 'Active', dues: 0 },
  { id: 'M-103', name: 'Vikram Malhotra', unit: 'A-201', wing: 'A', role: 'Tenant', email: 'v.malhotra@example.com', phone: '+91 98199 55412', status: 'Active', dues: 5000 },
  { id: 'M-104', name: 'Ananya Deshmukh', unit: 'B-101', wing: 'B', role: 'Owner', email: 'ananya.d@example.com', phone: '+91 98210 98765', status: 'Active', dues: 0 },
  { id: 'M-105', name: 'Suresh Patel', unit: 'B-202', wing: 'B', role: 'Owner', email: 'suresh.patel@example.com', phone: '+91 97654 32109', status: 'Active', dues: 12500 },
  { id: 'M-106', name: 'Farhan Qureshi', unit: 'C-301', wing: 'C', role: 'Owner', email: 'farhan.q@example.com', phone: '+91 98334 11223', status: 'Active', dues: 0 },
  { id: 'M-107', name: 'Deepika Nair', unit: 'C-402', wing: 'C', role: 'Tenant', email: 'deepika.nair@example.com', phone: '+91 98450 67890', status: 'Active', dues: 6000 },
  { id: 'M-108', name: 'Amitabh Sengupta', unit: 'D-101', wing: 'D', role: 'Owner', email: 'a.sengupta@example.com', phone: '+91 98765 43210', status: 'Active', dues: 0 }
];

const INITIAL_UNITS: Unit[] = [
  { id: 'U-A101', unitNo: 'A-101', wing: 'A', floor: 1, type: '3 BHK', area: 1450, owner: 'Rahul Sharma', occupancy: 'Owner Occupied', dues: 7500 },
  { id: 'U-A102', unitNo: 'A-102', wing: 'A', floor: 1, type: '2 BHK', area: 1150, owner: 'Priya Iyer', occupancy: 'Owner Occupied', dues: 0 },
  { id: 'U-A201', unitNo: 'A-201', wing: 'A', floor: 2, type: '3 BHK', area: 1450, owner: 'Rajesh Kulkarni', tenant: 'Vikram Malhotra', occupancy: 'Rented', dues: 5000 },
  { id: 'U-B101', unitNo: 'B-101', wing: 'B', floor: 1, type: '3 BHK', area: 1520, owner: 'Ananya Deshmukh', occupancy: 'Owner Occupied', dues: 0 },
  { id: 'U-B202', unitNo: 'B-202', wing: 'B', floor: 2, type: '4 BHK', area: 1850, owner: 'Suresh Patel', occupancy: 'Owner Occupied', dues: 12500 },
  { id: 'U-C301', unitNo: 'C-301', wing: 'C', floor: 3, type: '2 BHK', area: 1150, owner: 'Farhan Qureshi', occupancy: 'Owner Occupied', dues: 0 },
  { id: 'U-C402', unitNo: 'C-402', wing: 'C', floor: 4, type: '3 BHK', area: 1450, owner: 'Meera Rao', tenant: 'Deepika Nair', occupancy: 'Rented', dues: 6000 },
  { id: 'U-D101', unitNo: 'D-101', wing: 'D', floor: 1, type: '3 BHK', area: 1450, owner: 'Amitabh Sengupta', occupancy: 'Owner Occupied', dues: 0 }
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2024-005',
    unitNo: 'A-101',
    memberName: 'Rahul Sharma',
    month: 'May 2024',
    issueDate: '01 May 2024',
    dueDate: '31 May 2024',
    amount: 7500,
    breakdown: { maintenance: 5000, sinkingFund: 1000, waterCharges: 800, parkingCharge: 700 },
    status: 'Unpaid'
  },
  {
    id: 'INV-2024-004',
    unitNo: 'A-101',
    memberName: 'Rahul Sharma',
    month: 'Apr 2024',
    issueDate: '01 Apr 2024',
    dueDate: '30 Apr 2024',
    amount: 5000,
    breakdown: { maintenance: 4000, sinkingFund: 500, waterCharges: 500 },
    status: 'Paid',
    paidOn: '28 Apr 2024',
    paymentMode: 'UPI',
    txnId: 'UPI-89410482910'
  },
  {
    id: 'INV-2024-003',
    unitNo: 'A-101',
    memberName: 'Rahul Sharma',
    month: 'Mar 2024',
    issueDate: '01 Mar 2024',
    dueDate: '31 Mar 2024',
    amount: 5000,
    breakdown: { maintenance: 4000, sinkingFund: 500, waterCharges: 500 },
    status: 'Paid',
    paidOn: '29 Mar 2024',
    paymentMode: 'Net Banking',
    txnId: 'NB-48192048123'
  },
  {
    id: 'INV-2024-002',
    unitNo: 'A-101',
    memberName: 'Rahul Sharma',
    month: 'Feb 2024',
    issueDate: '01 Feb 2024',
    dueDate: '29 Feb 2024',
    amount: 5000,
    breakdown: { maintenance: 4000, sinkingFund: 500, waterCharges: 500 },
    status: 'Paid',
    paidOn: '27 Feb 2024',
    paymentMode: 'Card',
    txnId: 'CARD-992019401'
  },
  {
    id: 'INV-2024-001',
    unitNo: 'A-101',
    memberName: 'Rahul Sharma',
    month: 'Jan 2024',
    issueDate: '01 Jan 2024',
    dueDate: '31 Jan 2024',
    amount: 5000,
    breakdown: { maintenance: 4000, sinkingFund: 500, waterCharges: 500 },
    status: 'Paid',
    paidOn: '30 Jan 2024',
    paymentMode: 'UPI',
    txnId: 'UPI-77192049102'
  },
  {
    id: 'INV-2024-B202',
    unitNo: 'B-202',
    memberName: 'Suresh Patel',
    month: 'May 2024',
    issueDate: '01 May 2024',
    dueDate: '31 May 2024',
    amount: 12500,
    breakdown: { maintenance: 6500, sinkingFund: 2000, waterCharges: 1000, overduePenalty: 3000 },
    status: 'Overdue'
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  { date: '28 Apr 2024', invoiceNo: 'INV-2024-004', unitNo: 'A-101', mode: 'UPI', amount: 5000, status: 'Success', txnId: 'UPI-89410482910' },
  { date: '29 Mar 2024', invoiceNo: 'INV-2024-003', unitNo: 'A-101', mode: 'Net Banking', amount: 5000, status: 'Success', txnId: 'NB-48192048123' },
  { date: '27 Feb 2024', invoiceNo: 'INV-2024-002', unitNo: 'A-101', mode: 'Card', amount: 5000, status: 'Success', txnId: 'CARD-992019401' },
  { date: '30 Jan 2024', invoiceNo: 'INV-2024-001', unitNo: 'A-101', mode: 'UPI', amount: 5000, status: 'Success', txnId: 'UPI-77192049102' },
  { date: '02 May 2024', invoiceNo: 'INV-2024-A102', unitNo: 'A-102', mode: 'UPI', amount: 4800, status: 'Success', txnId: 'UPI-11029384756' },
  { date: '01 May 2024', invoiceNo: 'INV-2024-B101', unitNo: 'B-101', mode: 'Cheque', amount: 5500, status: 'Success', txnId: 'CHQ-882910' }
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'C-24',
    ticketNo: 'C-24',
    category: 'Plumbing',
    subject: 'Water leakage in Block A common duct',
    description: 'Persistent seepage noticed between 1st and 2nd floor pipe junctions.',
    unitNo: 'A-101',
    reportedBy: 'Rahul Sharma',
    reportedOn: '31 May 2024',
    priority: 'High',
    status: 'Open',
    assignedTo: 'Mahesh (Plumber)',
    internalNote: 'Plumbing team scheduled inspection at 4 PM.'
  },
  {
    id: 'C-21',
    ticketNo: 'C-21',
    category: 'Electrical',
    subject: 'Intercom buzzing sound and call drops',
    description: 'Intercom speaker in hall has loud static noise when receiving gate calls.',
    unitNo: 'A-101',
    reportedBy: 'Rahul Sharma',
    reportedOn: '24 May 2024',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Vikram Telecom',
    internalNote: 'Wiring junction tested; replacing handpiece on Monday.'
  },
  {
    id: 'C-15',
    ticketNo: 'C-15',
    category: 'Elevator',
    subject: 'Wing A Passenger Elevator jittery leveling',
    description: 'Lift stops 2 inches above floor level on 1st floor.',
    unitNo: 'A-101',
    reportedBy: 'Rahul Sharma',
    reportedOn: '10 May 2024',
    priority: 'High',
    status: 'Resolved',
    assignedTo: 'Otis Service Team',
    internalNote: 'Floor sensor calibrated and test run completed successfully.'
  },
  {
    id: 'C-10',
    ticketNo: 'C-10',
    category: 'Security',
    subject: 'Visitor log app not triggering OTP',
    description: 'Guest waited 10 minutes at main gate due to system delay.',
    unitNo: 'B-202',
    reportedBy: 'Suresh Patel',
    reportedOn: '04 May 2024',
    priority: 'Low',
    status: 'Closed',
    assignedTo: 'Gate Security Head',
    internalNote: 'Gate tablet WiFi restored.'
  }
];

const INITIAL_NOTICES: Notice[] = [
  {
    id: 'NOT-01',
    title: 'Annual General Body Meeting (AGM 2024)',
    category: 'Official Meeting',
    publishDate: '15 May 2024',
    meetingDate: '25 May 2024 at 6:00 PM',
    location: 'Community Hall, Green Meadows Clubhouse',
    summary: 'The 6th Annual General Body Meeting will be held to discuss annual audited accounts, maintenance fee revision for FY 24-25, and lift AMC renewals. All members are requested to attend.',
    pinned: true,
    author: 'Managing Committee',
    attachment: 'AGM_Notice_Agenda_2024.pdf'
  },
  {
    id: 'NOT-02',
    title: 'Monsoon Waterproofing and Drain Cleaning Drive',
    category: 'Maintenance',
    publishDate: '20 May 2024',
    meetingDate: '01 June - 07 June 2024',
    location: 'Terrace & Ground Gutters, All Wings',
    summary: 'Annual preventive waterproofing inspection and terrace drain declogging starts next week. Please keep terrace doors closed during contractor spray operations.',
    pinned: false,
    author: 'Estate Manager',
    attachment: 'Monsoon_Guidelines.pdf'
  },
  {
    id: 'NOT-03',
    title: 'Clubhouse Swimming Pool Periodic Maintenance',
    category: 'Amenities',
    publishDate: '28 May 2024',
    meetingDate: '02 June - 04 June 2024',
    location: 'Clubhouse Pool Deck',
    summary: 'The swimming pool will remain closed for 48 hours for annual deep chemical filtration, tile scrubbing, and water replacement.',
    pinned: false,
    author: 'Facility Desk',
    attachment: null
  }
];

const INITIAL_AMENITIES: Amenity[] = [
  {
    id: 'AMN-01',
    name: 'Community Hall',
    capacity: '150 Persons',
    charge: '₹2,500 / slot',
    deposit: '₹5,000 refundable',
    timings: '09:00 AM - 11:00 PM',
    available: true,
    description: 'Fully air-conditioned banquet hall with stage, audio system, and pantry area for family celebrations.'
  },
  {
    id: 'AMN-02',
    name: 'Club House',
    capacity: '50 Persons',
    charge: '₹1,000 / slot',
    deposit: '₹2,000 refundable',
    timings: '06:00 AM - 10:00 PM',
    available: true,
    description: 'Indoor recreation hub equipped with table tennis, chess, billiards lounge, and soft seating.'
  },
  {
    id: 'AMN-03',
    name: 'Badminton Court',
    capacity: '4 Players',
    charge: 'Free for residents',
    deposit: 'None',
    timings: '06:00 AM - 10:00 PM',
    available: true,
    description: 'Synthetic indoor wooden-cushioned court with tournament-grade LED floodlights.'
  },
  {
    id: 'AMN-04',
    name: 'Gymnasium & Yoga Studio',
    capacity: '25 Persons',
    charge: 'Included in Maintenance',
    deposit: 'None',
    timings: '05:30 AM - 10:30 PM',
    available: true,
    description: 'Modern cardiovascular and strength training equipment with certified morning trainers.'
  }
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-104',
    amenity: 'Community Hall',
    date: '25 May 2024',
    time: '06:00 PM - 10:00 PM',
    bookedBy: 'Rahul Sharma',
    unitNo: 'A-101',
    purpose: 'Family Anniversary Dinner',
    status: 'Confirmed',
    amount: '₹2,500'
  },
  {
    id: 'BK-101',
    amenity: 'Club House',
    date: '12 May 2024',
    time: '04:00 PM - 07:00 PM',
    bookedBy: 'Rahul Sharma',
    unitNo: 'A-101',
    purpose: 'Birthday Gathering',
    status: 'Completed',
    amount: '₹1,000'
  },
  {
    id: 'BK-105',
    amenity: 'Community Hall',
    date: '08 Jun 2024',
    time: '10:00 AM - 02:00 PM',
    bookedBy: 'Ananya Deshmukh',
    unitNo: 'B-101',
    purpose: 'Housewarming Luncheon',
    status: 'Pending Approval',
    amount: '₹2,500'
  }
];

const INITIAL_DOCS: SocietyDocument[] = [
  { id: 'DOC-01', title: 'Society Registration Certificate & Bye-Laws', category: 'Legal', size: '2.4 MB', date: '12 Jan 2019', access: 'All Members' },
  { id: 'DOC-02', title: 'Audited Financial Statements FY 2023-24', category: 'Finance', size: '4.8 MB', date: '30 Apr 2024', access: 'All Members' },
  { id: 'DOC-03', title: 'Fire Safety Certificate & Compliance NOC', category: 'Safety', size: '1.2 MB', date: '15 Mar 2024', access: 'All Members' },
  { id: 'DOC-04', title: 'EV Charging Bay Installation Guidelines', category: 'Rules', size: '850 KB', date: '10 Feb 2024', access: 'All Members' },
  { id: 'DOC-05', title: 'Managing Committee Election Minutes 2023', category: 'Minutes', size: '1.9 MB', date: '18 Sep 2023', access: 'Admin & Owners' }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'NTF-01', title: 'New Invoice Issued', text: 'Invoice INV-2024-005 for ₹7,500 has been generated for May 2024.', time: 'Today, 09:30 AM', read: false, type: 'billing' },
  { id: 'NTF-02', title: 'AGM Notice Published', text: 'Annual General Meeting is scheduled for 25 May at 6:00 PM.', time: 'Yesterday', read: false, type: 'notice' },
  { id: 'NTF-03', title: 'Complaint Status Updated', text: 'Complaint #C-21 (Intercom buzzing) is now In Progress.', time: '2 days ago', read: true, type: 'complaint' },
  { id: 'NTF-04', title: 'Amenity Booking Confirmed', text: 'Community Hall reservation for 25 May 2024 confirmed.', time: '3 days ago', read: true, type: 'booking' }
];

@Injectable({
  providedIn: 'root'
})
export class SocietyStateService {
  // Signals
  readonly society = signal<Society>(INITIAL_SOCIETY);
  readonly currentUserRole = signal<UserRole>('admin');
  readonly currentView = signal<string>('dashboard');
  readonly adminUser = signal<User>(INITIAL_ADMIN);
  readonly memberUser = signal<User>(INITIAL_MEMBER);
  readonly metrics = signal<MetricStats>(INITIAL_METRICS);
  readonly collectionOverview = signal<CollectionMonth[]>(INITIAL_COLLECTION);
  readonly complaintStats = signal<ComplaintStats>(INITIAL_COMPLAINT_STATS);
  readonly recentActivities = signal<Activity[]>(INITIAL_ACTIVITIES);
  readonly members = signal<Member[]>(INITIAL_MEMBERS);
  readonly units = signal<Unit[]>(INITIAL_UNITS);
  readonly invoices = signal<Invoice[]>(INITIAL_INVOICES);
  readonly paymentHistory = signal<Payment[]>(INITIAL_PAYMENTS);
  readonly complaints = signal<Complaint[]>(INITIAL_COMPLAINTS);
  readonly notices = signal<Notice[]>(INITIAL_NOTICES);
  readonly amenities = signal<Amenity[]>(INITIAL_AMENITIES);
  readonly bookings = signal<Booking[]>(INITIAL_BOOKINGS);
  readonly documents = signal<SocietyDocument[]>(INITIAL_DOCS);
  readonly notifications = signal<AppNotification[]>(INITIAL_NOTIFICATIONS);
  readonly toasts = signal<ToastMessage[]>([]);

  // Selected invoice for receipt modal
  readonly selectedReceiptInvoice = signal<Invoice | null>(null);

  // Computed signals
  readonly activeUser = computed(() => {
    return this.currentUserRole() === 'admin' ? this.adminUser() : this.memberUser();
  });

  readonly unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  readonly memberA101Dues = computed(() => {
    const inv = this.invoices().find(i => i.unitNo === 'A-101' && i.status === 'Unpaid');
    return inv ? inv.amount : 0;
  });

  constructor() {
    this.loadFromStorage();

    // Auto-save effect whenever critical state changes
    effect(() => {
      this.saveToStorage();
    });
  }

  setRole(role: UserRole) {
    this.currentUserRole.set(role);
    this.currentView.set('dashboard');
    document.body.setAttribute('data-role', role);
    this.showToast(`Switched to ${role === 'admin' ? 'Admin' : 'Member'} Portal`, 'info');
  }

  setView(view: string) {
    this.currentView.set(view);
  }

  showToast(message: string, type: ToastMessage['type'] = 'info') {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type };
    this.toasts.update(list => [...list, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 3500);
  }

  removeToast(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  // Pay Now Flow for Rahul Sharma
  payInvoice(invoiceId: string, paymentMethod: string): void {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const amount = inv.amount;
    const txnId = `${paymentMethod.toUpperCase()}-${Math.floor(10000000000 + Math.random() * 90000000000)}`;

    // 1. Update Invoices
    this.invoices.update(list => list.map(item => {
      if (item.id === invoiceId) {
        return {
          ...item,
          status: 'Paid',
          paidOn: '31 May 2024',
          paymentMode: `${paymentMethod} (Instant)`,
          txnId
        };
      }
      return item;
    }));

    // 2. Clear Member and Unit dues
    this.members.update(list => list.map(m => m.unit === 'A-101' ? { ...m, dues: 0 } : m));
    this.units.update(list => list.map(u => u.unitNo === 'A-101' ? { ...u, dues: 0 } : u));

    // 3. Update Admin Metrics
    this.metrics.update(m => ({
      ...m,
      totalCollection: m.totalCollection + amount,
      pendingDues: Math.max(0, m.pendingDues - amount)
    }));

    // 4. Record Payment History
    const newPayment: Payment = {
      date: '31 May 2024',
      invoiceNo: invoiceId,
      unitNo: 'A-101',
      mode: paymentMethod,
      amount,
      status: 'Success',
      txnId
    };
    this.paymentHistory.update(list => [newPayment, ...list]);

    // 5. Add Activity
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: 'payment',
      title: 'Payment received from A-101',
      subtitle: `Maintenance Dues for May 2024 (${paymentMethod})`,
      amount: `₹${amount.toLocaleString('en-IN')}`,
      time: 'Just now',
      timestamp: Date.now(),
      icon: 'payment'
    };
    this.recentActivities.update(list => [newActivity, ...list]);

    // Set selected invoice for receipt view
    const updated = this.invoices().find(i => i.id === invoiceId) || null;
    this.selectedReceiptInvoice.set(updated);

    this.showToast(`Payment of ₹${amount.toLocaleString('en-IN')} confirmed via ${paymentMethod}! Receipt generated.`, 'success');
  }

  raiseComplaint(data: { category: string; priority: Complaint['priority']; subject: string; description: string }): void {
    const tNo = `C-${this.complaints().length + 25}`;
    const newComplaint: Complaint = {
      id: tNo,
      ticketNo: tNo,
      category: data.category,
      subject: data.subject,
      description: data.description,
      unitNo: 'A-101',
      reportedBy: 'Rahul Sharma',
      reportedOn: 'Today',
      priority: data.priority,
      status: 'Open',
      assignedTo: 'Estate Desk',
      internalNote: 'Registered via Angular Member Portal.'
    };

    this.complaints.update(list => [newComplaint, ...list]);
    this.metrics.update(m => ({ ...m, openComplaints: m.openComplaints + 1 }));
    this.complaintStats.update(cs => ({ ...cs, open: cs.open + 1, total: cs.total + 1 }));

    this.recentActivities.update(list => [
      {
        id: `act-${Date.now()}`,
        type: 'complaint',
        title: `New complaint #${tNo} reported`,
        subtitle: data.subject,
        time: 'Just now',
        timestamp: Date.now(),
        icon: 'alert'
      },
      ...list
    ]);

    this.showToast(`Complaint #${tNo} raised successfully! Tracking on dashboard.`, 'success');
  }

  updateComplaintStatus(id: string, newStatus: Complaint['status']): void {
    this.complaints.update(list => list.map(c => c.id === id ? { ...c, status: newStatus } : c));

    // Recalculate stats
    const open = this.complaints().filter(c => c.status === 'Open').length;
    const inProg = this.complaints().filter(c => c.status === 'In Progress').length;
    const resolved = this.complaints().filter(c => c.status === 'Resolved').length;
    const closed = this.complaints().filter(c => c.status === 'Closed').length;

    this.complaintStats.set({ open, inProgress: inProg, resolved, closed, total: this.complaints().length });
    this.metrics.update(m => ({ ...m, openComplaints: open }));
    this.showToast(`Complaint #${id} marked as ${newStatus}`, 'info');
  }

  publishNotice(data: { title: string; category: string; meetingDate?: string; location?: string; summary: string; pinned: boolean }): void {
    const newNotice: Notice = {
      id: `NOT-${Date.now()}`,
      title: data.title,
      category: data.category,
      publishDate: 'Today',
      meetingDate: data.meetingDate || 'Upcoming',
      location: data.location || 'Clubhouse',
      summary: data.summary,
      pinned: data.pinned,
      author: 'Managing Committee',
      attachment: null
    };

    this.notices.update(list => [newNotice, ...list]);
    this.recentActivities.update(list => [
      {
        id: `act-${Date.now()}`,
        type: 'notice',
        title: 'Notice published',
        subtitle: data.title,
        time: 'Just now',
        timestamp: Date.now(),
        icon: 'megaphone'
      },
      ...list
    ]);

    this.notifications.update(list => [
      {
        id: `ntf-${Date.now()}`,
        title: 'New Society Notice',
        text: data.title,
        time: 'Just now',
        read: false,
        type: 'notice'
      },
      ...list
    ]);

    this.showToast('Society Notice published and broadcast to members!', 'success');
  }

  bookAmenity(data: { amenity: string; date: string; time: string; purpose: string }): void {
    const charge = data.amenity.includes('Hall') ? '₹2,500' : (data.amenity.includes('Club') ? '₹1,000' : 'Free');
    const newBooking: Booking = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      amenity: data.amenity,
      date: data.date,
      time: data.time,
      bookedBy: 'Rahul Sharma',
      unitNo: 'A-101',
      purpose: data.purpose,
      status: 'Confirmed',
      amount: charge
    };

    this.bookings.update(list => [newBooking, ...list]);
    this.recentActivities.update(list => [
      {
        id: `act-${Date.now()}`,
        type: 'amenity',
        title: 'Amenity booked',
        subtitle: `${data.amenity} by Rahul Sharma (A-101)`,
        time: 'Just now',
        timestamp: Date.now(),
        icon: 'calendar'
      },
      ...list
    ]);

    this.showToast(`Amenity reservation confirmed for ${data.amenity}!`, 'success');
  }

  approveBooking(bookingId: string): void {
    this.bookings.update(list => list.map(b => b.id === bookingId ? { ...b, status: 'Confirmed' } : b));
    this.showToast(`Booking #${bookingId} approved!`, 'success');
  }

  addMember(data: { name: string; unit: string; role: string; email: string; phone: string }): void {
    const newMember: Member = {
      id: `M-${Math.floor(110 + Math.random() * 800)}`,
      name: data.name,
      unit: data.unit,
      wing: data.unit[0] || 'A',
      role: data.role,
      email: data.email,
      phone: data.phone,
      status: 'Active',
      dues: 0
    };

    this.members.update(list => [...list, newMember]);
    this.metrics.update(m => ({ ...m, totalMembers: m.totalMembers + 1 }));
    this.showToast(`Member ${data.name} (${data.unit}) registered!`, 'success');
  }

  addUnit(data: { unitNo: string; wing: string; type: string; area: number; owner: string }): void {
    const newUnit: Unit = {
      id: `U-${data.unitNo}`,
      unitNo: data.unitNo,
      wing: data.wing,
      floor: parseInt(data.unitNo[2]) || 1,
      type: data.type,
      area: data.area,
      owner: data.owner,
      occupancy: 'Owner Occupied',
      dues: 0
    };

    this.units.update(list => [...list, newUnit]);
    this.metrics.update(m => ({ ...m, totalUnits: m.totalUnits + 1 }));
    this.showToast(`Unit ${data.unitNo} added to society database!`, 'success');
  }

  generateBulkInvoices(): void {
    this.metrics.update(m => ({
      ...m,
      totalCollection: m.totalCollection + 450000,
      pendingDues: m.pendingDues + 442400
    }));

    this.notifications.update(list => [
      {
        id: `ntf-${Date.now()}`,
        title: 'Bulk Invoices Issued',
        text: 'June 2024 maintenance invoices issued to all 128 units.',
        time: 'Just now',
        read: false,
        type: 'billing'
      },
      ...list
    ]);

    this.showToast('Successfully issued 128 monthly maintenance invoices!', 'success');
  }

  markNotificationsAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.showToast('All notifications marked as read', 'info');
  }

  exportCsv(type: 'payments' | 'collections' | 'dues'): void {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'society_export.csv';

    if (type === 'payments') {
      csvContent += 'Date,Invoice_No,Unit_No,Mode,Amount,Status,Txn_ID\n';
      this.paymentHistory().forEach(p => {
        csvContent += `${p.date},${p.invoiceNo},${p.unitNo},${p.mode},${p.amount},${p.status},${p.txnId}\n`;
      });
      filename = 'payment_transactions.csv';
    } else {
      csvContent += 'Unit_No,Owner_Name,Maintenance,Sinking_Fund,Total_Billed,Status\n';
      this.invoices().forEach(i => {
        csvContent += `${i.unitNo},"${i.memberName}",${i.amount * 0.7},${i.amount * 0.3},${i.amount},${i.status}\n`;
      });
      filename = 'maintenance_collections.csv';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast(`Exported ${filename} successfully!`, 'success');
  }

  resetToBaseline(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.society.set(INITIAL_SOCIETY);
    this.adminUser.set(INITIAL_ADMIN);
    this.memberUser.set(INITIAL_MEMBER);
    this.metrics.set(INITIAL_METRICS);
    this.collectionOverview.set(INITIAL_COLLECTION);
    this.complaintStats.set(INITIAL_COMPLAINT_STATS);
    this.recentActivities.set(INITIAL_ACTIVITIES);
    this.members.set(INITIAL_MEMBERS);
    this.units.set(INITIAL_UNITS);
    this.invoices.set(INITIAL_INVOICES);
    this.paymentHistory.set(INITIAL_PAYMENTS);
    this.complaints.set(INITIAL_COMPLAINTS);
    this.notices.set(INITIAL_NOTICES);
    this.amenities.set(INITIAL_AMENITIES);
    this.bookings.set(INITIAL_BOOKINGS);
    this.documents.set(INITIAL_DOCS);
    this.notifications.set(INITIAL_NOTIFICATIONS);
    this.currentView.set('dashboard');
    this.showToast('Demo data reset to initial baseline', 'info');
  }

  private saveToStorage(): void {
    try {
      const data = {
        society: this.society(),
        currentUserRole: this.currentUserRole(),
        metrics: this.metrics(),
        collectionOverview: this.collectionOverview(),
        complaintStats: this.complaintStats(),
        recentActivities: this.recentActivities(),
        members: this.members(),
        units: this.units(),
        invoices: this.invoices(),
        paymentHistory: this.paymentHistory(),
        complaints: this.complaints(),
        notices: this.notices(),
        amenities: this.amenities(),
        bookings: this.bookings(),
        documents: this.documents(),
        notifications: this.notifications()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.society) this.society.set(data.society);
      if (data.currentUserRole) this.currentUserRole.set(data.currentUserRole);
      if (data.metrics) this.metrics.set(data.metrics);
      if (data.collectionOverview) this.collectionOverview.set(data.collectionOverview);
      if (data.complaintStats) this.complaintStats.set(data.complaintStats);
      if (data.recentActivities) this.recentActivities.set(data.recentActivities);
      if (data.members) this.members.set(data.members);
      if (data.units) this.units.set(data.units);
      if (data.invoices) this.invoices.set(data.invoices);
      if (data.paymentHistory) this.paymentHistory.set(data.paymentHistory);
      if (data.complaints) this.complaints.set(data.complaints);
      if (data.notices) this.notices.set(data.notices);
      if (data.amenities) this.amenities.set(data.amenities);
      if (data.bookings) this.bookings.set(data.bookings);
      if (data.documents) this.documents.set(data.documents);
      if (data.notifications) this.notifications.set(data.notifications);
    } catch (e) {
      console.warn('Could not parse from localStorage', e);
    }
  }
}
