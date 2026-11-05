import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
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
  ToastMessage,
  VisitorPass,
  SocietyPoll,
  ParkingSlot,
  AuditLogEntry
} from '../models/society.model';
import { SocietyApiService, SocietyBootstrapPayload } from '../core/services/society-api.service';
import { ToastNotificationService } from '../core/services/toast-notification.service';

// Typed baseline JSON seed imports from `src/assets/mock-data/*.json`
import societySeed from '../../assets/mock-data/society.json';
import membersUnitsSeed from '../../assets/mock-data/members-units.json';
import billingSeed from '../../assets/mock-data/billing.json';
import complaintsSeed from '../../assets/mock-data/complaints.json';
import noticesAmenitiesSeed from '../../assets/mock-data/notices-amenities.json';
import operationsSeed from '../../assets/mock-data/operations.json';

const STORAGE_KEY = 'green_meadows_sms_angular_v2';

@Injectable({
  providedIn: 'root'
})
export class SocietyStateService {
  private readonly apiService = inject(SocietyApiService, { optional: true });
  private readonly toastService = inject(ToastNotificationService);
  private readonly router = inject(Router, { optional: true });

  // Observability & Loading Signals
  readonly isLoading = signal<boolean>(false);
  readonly dataSourceMode = signal<'mock-json-assets' | 'local-storage-cache'>('mock-json-assets');

  // Domain State Signals
  readonly society = signal<Society>(societySeed.society as Society);
  readonly currentUserRole = signal<UserRole>('admin');
  readonly currentView = signal<string>('dashboard');
  readonly adminUser = signal<User>(societySeed.adminUser as User);
  readonly memberUser = signal<User>(societySeed.memberUser as User);
  readonly metrics = signal<MetricStats>(societySeed.metrics as MetricStats);
  readonly collectionOverview = signal<CollectionMonth[]>(societySeed.collectionOverview as CollectionMonth[]);
  readonly complaintStats = signal<ComplaintStats>(societySeed.complaintStats as ComplaintStats);
  readonly recentActivities = signal<Activity[]>(operationsSeed.recentActivities as Activity[]);
  readonly members = signal<Member[]>(membersUnitsSeed.members as Member[]);
  readonly units = signal<Unit[]>(membersUnitsSeed.units as Unit[]);
  readonly invoices = signal<Invoice[]>(billingSeed.invoices as Invoice[]);
  readonly paymentHistory = signal<Payment[]>(billingSeed.paymentHistory as Payment[]);
  readonly complaints = signal<Complaint[]>(complaintsSeed.complaints as Complaint[]);
  readonly notices = signal<Notice[]>(noticesAmenitiesSeed.notices as Notice[]);
  readonly amenities = signal<Amenity[]>(noticesAmenitiesSeed.amenities as Amenity[]);
  readonly bookings = signal<Booking[]>(noticesAmenitiesSeed.bookings as Booking[]);
  readonly documents = signal<SocietyDocument[]>(operationsSeed.documents as SocietyDocument[]);
  readonly notifications = signal<AppNotification[]>(operationsSeed.notifications as AppNotification[]);
  readonly visitors = signal<VisitorPass[]>(operationsSeed.visitors as VisitorPass[]);
  readonly polls = signal<SocietyPoll[]>(operationsSeed.polls as SocietyPoll[]);
  readonly parkingSlots = signal<ParkingSlot[]>(operationsSeed.parkingSlots as ParkingSlot[]);
  readonly auditLogs = signal<AuditLogEntry[]>(operationsSeed.auditLogs as AuditLogEntry[]);

  // Ephemeral UI Toasts (delegated to ToastNotificationService; excluded from localStorage)
  readonly toasts = this.toastService.toasts;

  // Selected invoice for receipt modal
  readonly selectedReceiptInvoice = signal<Invoice | null>(null);

  // ── Dynamic Computed Selectors (No Hardcoded Unit IDs) ────────────────────────
  readonly activeUser = computed(() => {
    return this.currentUserRole() === 'admin' ? this.adminUser() : this.memberUser();
  });

  readonly currentResidentUnit = computed(() => {
    return this.memberUser().unit || 'A-101';
  });

  readonly unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  readonly activeUnitInvoices = computed(() => {
    const unit = this.currentResidentUnit();
    return this.invoices().filter(i => i.unitNo === unit);
  });

  readonly activeUnitPayments = computed(() => {
    const unit = this.currentResidentUnit();
    return this.paymentHistory().filter(p => p.unitNo === unit);
  });

  readonly activeUnitComplaints = computed(() => {
    const unit = this.currentResidentUnit();
    return this.complaints().filter(c => c.unitNo === unit);
  });

  readonly activeUnitBookings = computed(() => {
    const unit = this.currentResidentUnit();
    return this.bookings().filter(b => b.unitNo === unit);
  });

  readonly activeUnitVisitors = computed(() => {
    const unit = this.currentResidentUnit();
    return this.visitors().filter(v => v.unitNo === unit);
  });

  readonly activeUnitDues = computed(() => {
    const inv = this.activeUnitInvoices().find(i => i.status === 'Unpaid');
    return inv ? inv.amount : 0;
  });

  /** Alias preserved for backward compatibility */
  readonly memberA101Dues = this.activeUnitDues;

  constructor() {
    const hasLocalCache = this.loadFromStorage();
    if (!hasLocalCache) {
      this.hydrateFromApi(false);
    }

    // Sync `currentView` signal with Angular Router URL changes (Back/Forward & deep links)
    this.router?.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        const segment = event.urlAfterRedirects.replace(/^\//, '').split('/')[0] || 'dashboard';
        if (this.currentView() !== segment) {
          this.currentView.set(segment);
        }
      });

    // Auto-save effect whenever domain state mutates (excludes ephemeral UI toasts)
    effect(() => {
      this.saveToStorage();
    });
  }

  hydrateFromApi(notifyUser = false): void {
    if (!this.apiService) return;
    this.isLoading.set(true);

    this.apiService.fetchBootstrapBundle().subscribe({
      next: (bundle: SocietyBootstrapPayload) => {
        this.applyBootstrapPayload(bundle);
        this.dataSourceMode.set('mock-json-assets');
        this.isLoading.set(false);
        if (notifyUser) {
          this.showToast('Reloaded fresh baseline data from /assets/mock-data/*.json', 'info');
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private applyBootstrapPayload(bundle: SocietyBootstrapPayload): void {
    this.society.set(bundle.overview.society);
    this.adminUser.set(bundle.overview.adminUser);
    this.memberUser.set(bundle.overview.memberUser);
    this.metrics.set(bundle.overview.metrics);
    this.collectionOverview.set(bundle.overview.collectionOverview);
    this.complaintStats.set(bundle.overview.complaintStats);

    this.members.set(bundle.directory.members);
    this.units.set(bundle.directory.units);

    this.invoices.set(bundle.billing.invoices);
    this.paymentHistory.set(bundle.billing.paymentHistory);

    this.complaints.set(bundle.complaints.complaints);

    this.notices.set(bundle.facilities.notices);
    this.amenities.set(bundle.facilities.amenities);
    this.bookings.set(bundle.facilities.bookings);

    this.recentActivities.set(bundle.operations.recentActivities);
    this.documents.set(bundle.operations.documents);
    this.notifications.set(bundle.operations.notifications);
    this.visitors.set(bundle.operations.visitors);
    this.polls.set(bundle.operations.polls);
    this.parkingSlots.set(bundle.operations.parkingSlots);
    this.auditLogs.set(bundle.operations.auditLogs);
  }

  setRole(role: UserRole): void {
    this.currentUserRole.set(role);
    this.setView('dashboard');
    document.body.setAttribute('data-role', role);
    this.showToast(`Switched to ${role === 'admin' ? 'Admin' : 'Member'} Portal`, 'info');
  }

  setView(view: string): void {
    this.currentView.set(view);
    this.router?.navigate(['/' + view]);
  }

  showToast(message: string, type: ToastMessage['type'] = 'info'): void {
    this.toastService.showToast(message, type);
  }

  removeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  // ── Billing & Payment Flows ───────────────────────────────────────────────────
  payInvoice(invoiceId: string, paymentMethod: string): void {
    const inv = this.invoices().find(i => i.id === invoiceId);
    if (!inv) return;

    const unitNo = inv.unitNo || this.currentResidentUnit();
    const amount = inv.amount;
    const txnId = `${paymentMethod.toUpperCase()}-${Math.floor(10000000000 + Math.random() * 90000000000)}`;

    this.invoices.update(list =>
      list.map(item =>
        item.id === invoiceId
          ? {
              ...item,
              status: 'Paid',
              paidOn: '31 May 2024',
              paymentMode: `${paymentMethod} (Instant)`,
              txnId
            }
          : item
      )
    );

    this.members.update(list => list.map(m => (m.unit === unitNo ? { ...m, dues: 0 } : m)));
    this.units.update(list => list.map(u => (u.unitNo === unitNo ? { ...u, dues: 0 } : u)));

    this.metrics.update(m => ({
      ...m,
      totalCollection: m.totalCollection + amount,
      pendingDues: Math.max(0, m.pendingDues - amount)
    }));

    const newPayment: Payment = {
      date: '31 May 2024',
      invoiceNo: invoiceId,
      unitNo,
      mode: paymentMethod,
      amount,
      status: 'Success',
      txnId
    };
    this.paymentHistory.update(list => [newPayment, ...list]);

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: 'payment',
      title: `Payment received from ${unitNo}`,
      subtitle: `Maintenance Dues for May 2024 (${paymentMethod})`,
      amount: `₹${amount.toLocaleString('en-IN')}`,
      time: 'Just now',
      timestamp: Date.now(),
      icon: 'payment'
    };
    this.recentActivities.update(list => [newActivity, ...list]);

    const updated = this.invoices().find(i => i.id === invoiceId) || null;
    this.selectedReceiptInvoice.set(updated);
    this.logAudit('Billing', `Invoice ${invoiceId} paid via ${paymentMethod} (Txn: ${txnId}).`);
    this.showToast(`Payment of ₹${amount.toLocaleString('en-IN')} confirmed via ${paymentMethod}! Receipt generated.`, 'success');
  }

  // ── Complaints & SLA Management ───────────────────────────────────────────────
  raiseComplaint(data: { category: string; priority: Complaint['priority']; subject: string; description: string }): void {
    const tNo = `C-${this.complaints().length + 25}`;
    const unitNo = this.currentResidentUnit();
    const reportedBy = this.memberUser().name;

    const newComplaint: Complaint = {
      id: tNo,
      ticketNo: tNo,
      category: data.category,
      subject: data.subject,
      description: data.description,
      unitNo,
      reportedBy,
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

    this.logAudit('Complaints', `Ticket #${tNo} (${data.category}) raised for Unit ${unitNo}.`);
    this.showToast(`Complaint #${tNo} raised successfully! Tracking on dashboard.`, 'success');
  }

  updateComplaintStatus(id: string, newStatus: Complaint['status']): void {
    this.complaints.update(list => list.map(c => (c.id === id ? { ...c, status: newStatus } : c)));

    const open = this.complaints().filter(c => c.status === 'Open').length;
    const inProg = this.complaints().filter(c => c.status === 'In Progress').length;
    const resolved = this.complaints().filter(c => c.status === 'Resolved').length;
    const closed = this.complaints().filter(c => c.status === 'Closed').length;

    this.complaintStats.set({ open, inProgress: inProg, resolved, closed, total: this.complaints().length });
    this.metrics.update(m => ({ ...m, openComplaints: open }));
    this.logAudit('Complaints', `Updated complaint #${id} status to ${newStatus}.`);
    this.showToast(`Complaint #${id} marked as ${newStatus}`, 'info');
  }

  // ── Notices & Amenities ───────────────────────────────────────────────────────
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

    this.logAudit('Notices', `Published notice "${data.title}" (${data.category}).`);
    this.showToast('Society Notice published and broadcast to members!', 'success');
  }

  bookAmenity(data: { amenity: string; date: string; time: string; purpose: string }): void {
    const unitNo = this.currentResidentUnit();
    const bookedBy = this.memberUser().name;
    const charge = data.amenity.includes('Hall') ? '₹2,500' : data.amenity.includes('Club') ? '₹1,000' : 'Free';
    const newBooking: Booking = {
      id: `BK-${Math.floor(100 + Math.random() * 900)}`,
      amenity: data.amenity,
      date: data.date,
      time: data.time,
      bookedBy,
      unitNo,
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
        subtitle: `${data.amenity} by ${bookedBy} (${unitNo})`,
        time: 'Just now',
        timestamp: Date.now(),
        icon: 'calendar'
      },
      ...list
    ]);

    this.showToast(`Amenity reservation confirmed for ${data.amenity}!`, 'success');
  }

  approveBooking(bookingId: string): void {
    this.bookings.update(list => list.map(b => (b.id === bookingId ? { ...b, status: 'Confirmed' } : b)));
    this.showToast(`Booking #${bookingId} approved!`, 'success');
  }

  // ── Directory & Bulk Operations ───────────────────────────────────────────────
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
      floor: parseInt(data.unitNo[2], 10) || 1,
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

    this.logAudit('Billing', 'Generated monthly maintenance invoices for 128 units.');
    this.showToast('Successfully issued 128 monthly maintenance invoices!', 'success');
  }

  markNotificationsAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.showToast('All notifications marked as read', 'info');
  }

  exportCsv(type: 'payments' | 'collections' | 'dues' | 'members'): void {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'society_export.csv';

    if (type === 'payments') {
      csvContent += 'Date,Invoice_No,Unit_No,Mode,Amount,Status,Txn_ID\n';
      this.paymentHistory().forEach(p => {
        csvContent += `${p.date},${p.invoiceNo},${p.unitNo},${p.mode},${p.amount},${p.status},${p.txnId}\n`;
      });
      filename = 'payment_transactions.csv';
    } else if (type === 'members') {
      csvContent += 'Member_ID,Resident_Name,Unit,Wing,Role,Phone,Email,Dues,Status\n';
      this.members().forEach(m => {
        csvContent += `${m.id},"${m.name}",${m.unit},${m.wing},${m.role},"${m.phone}",${m.email},${m.dues},${m.status}\n`;
      });
      filename = 'members_directory.csv';
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

  // ── Visitor & Gate Security Management ────────────────────────────────────────
  preApproveVisitor(data: {
    visitorName: string;
    visitorType: VisitorPass['visitorType'];
    company?: string;
    unitNo: string;
    phone: string;
    expectedTime: string;
    vehicleNo?: string;
  }): VisitorPass {
    const passCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newVisitor: VisitorPass = {
      id: `VIS-${Math.floor(105 + Math.random() * 890)}`,
      passCode,
      visitorName: data.visitorName,
      visitorType: data.visitorType,
      company: data.company || data.visitorType,
      unitNo: data.unitNo || this.currentResidentUnit(),
      hostName: this.activeUser().name,
      phone: data.phone,
      expectedTime: data.expectedTime || 'Today',
      vehicleNo: data.vehicleNo,
      status: 'Pre-Approved'
    };

    this.visitors.update(list => [newVisitor, ...list]);
    this.recentActivities.update(list => [
      {
        id: `act-${Date.now()}`,
        type: 'visitor',
        title: `Gate Pass #${passCode} issued`,
        subtitle: `${data.visitorName} (${data.visitorType}) for ${newVisitor.unitNo}`,
        time: 'Just now',
        timestamp: Date.now(),
        icon: 'calendar'
      },
      ...list
    ]);
    this.logAudit('Security', `Pre-approved visitor ${data.visitorName} (OTP: ${passCode}) for Unit ${newVisitor.unitNo}.`);
    this.showToast(`Gate Pass OTP #${passCode} generated for ${data.visitorName}!`, 'success');
    return newVisitor;
  }

  updateVisitorStatus(id: string, status: VisitorPass['status']): void {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.visitors.update(list =>
      list.map(v => {
        if (v.id !== id) return v;
        return {
          ...v,
          status,
          checkInTime: status === 'Inside Premises' ? v.checkInTime || nowTime : v.checkInTime,
          checkOutTime: status === 'Checked Out' ? nowTime : v.checkOutTime
        };
      })
    );
    this.logAudit('Security', `Updated visitor pass #${id} status to ${status}.`);
    this.showToast(`Visitor pass ${id} marked as ${status}`, 'info');
  }

  // ── Community Polls & Committee Voting ────────────────────────────────────────
  castPollVote(pollId: string, optionId: string): void {
    this.polls.update(list =>
      list.map(p => {
        if (p.id !== pollId || p.status !== 'Active') return p;
        const previousOptionId = p.userVotedOptionId;
        const updatedOptions = p.options.map(opt => {
          if (opt.id === optionId && previousOptionId !== optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          if (opt.id === previousOptionId && previousOptionId !== optionId) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        });
        const newTotal = previousOptionId ? p.totalVotes : p.totalVotes + 1;
        return {
          ...p,
          options: updatedOptions,
          totalVotes: newTotal,
          userVotedOptionId: optionId
        };
      })
    );
    this.logAudit('Governance', `Cast vote on poll ${pollId} (Option ${optionId}).`);
    this.showToast('Your society resolution vote has been recorded!', 'success');
  }

  createPoll(data: {
    title: string;
    description: string;
    category: SocietyPoll['category'];
    endDate: string;
    options: string[];
  }): void {
    const newPoll: SocietyPoll = {
      id: `POLL-0${this.polls().length + 1}`,
      title: data.title,
      description: data.description,
      category: data.category,
      createdBy: this.activeUser().name,
      endDate: data.endDate || '30 Jun 2024',
      status: 'Active',
      totalVotes: 0,
      userVotedOptionId: null,
      options: data.options.map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
        votes: 0
      }))
    };

    this.polls.update(list => [newPoll, ...list]);
    this.logAudit('Governance', `Published community poll "${data.title}".`);
    this.showToast(`Poll "${data.title}" published to all society members!`, 'success');
  }

  closePoll(pollId: string): void {
    this.polls.update(list => list.map(p => (p.id === pollId ? { ...p, status: 'Closed' } : p)));
    this.logAudit('Governance', `Closed voting for poll ${pollId}.`);
    this.showToast(`Poll ${pollId} closed and final tally locked.`, 'info');
  }

  // ── Parking & EV Bay Management ───────────────────────────────────────────────
  registerParkingVehicle(data: {
    slotNo: string;
    wing: string;
    type: ParkingSlot['type'];
    unitNo: string;
    ownerName: string;
    vehicleNo: string;
    vehicleType: ParkingSlot['vehicleType'];
    evEnabled: boolean;
  }): void {
    const newSlot: ParkingSlot = {
      id: `PK-${Math.floor(10 + Math.random() * 90)}`,
      slotNo: data.slotNo,
      wing: data.wing,
      type: data.type,
      unitNo: data.unitNo,
      ownerName: data.ownerName,
      vehicleNo: data.vehicleNo.toUpperCase(),
      vehicleType: data.vehicleType,
      rfidTag: `RFID-${Math.floor(88610 + Math.random() * 900)}`,
      evEnabled: data.evEnabled,
      status: 'Allocated'
    };
    this.parkingSlots.update(list => [newSlot, ...list]);
    this.logAudit('Security', `Allocated parking slot ${data.slotNo} & RFID tag for vehicle ${newSlot.vehicleNo} (${data.unitNo}).`);
    this.showToast(`Vehicle ${newSlot.vehicleNo} registered to slot ${data.slotNo} with RFID!`, 'success');
  }

  // ── Complaint Rating, Document Upload & Settings ──────────────────────────────
  rateComplaint(complaintId: string, rating: number): void {
    this.complaints.update(list => list.map(c => (c.id === complaintId ? { ...c, rating } : c)));
    this.showToast(`Thank you! Rated complaint #${complaintId} resolution ${rating}/5 ★`, 'success');
  }

  uploadDocument(data: { title: string; category: string; access: string }): void {
    const newDoc: SocietyDocument = {
      id: `DOC-0${this.documents().length + 1}`,
      title: data.title,
      category: data.category,
      size: '1.5 MB',
      date: 'Today',
      access: data.access
    };
    this.documents.update(list => [newDoc, ...list]);
    this.logAudit('Settings', `Uploaded society document "${data.title}" (${data.category}).`);
    this.showToast(`Document "${data.title}" uploaded to repository!`, 'success');
  }

  updateSocietySettings(data: Partial<Society>): void {
    this.society.update(curr => ({ ...curr, ...data }));
    this.logAudit('Settings', 'Updated society billing & configuration parameters.');
    this.showToast('Society settings and billing rates saved!', 'success');
  }

  logAudit(module: AuditLogEntry['module'], details: string, action?: string): void {
    const entry: AuditLogEntry = {
      id: `AUD-${Math.floor(905 + Math.random() * 900)}`,
      timestamp: 'Just now',
      actor: this.activeUser().name,
      role: this.currentUserRole(),
      action: action || details.split('.')[0],
      module,
      details
    };
    this.auditLogs.update(list => [entry, ...list]);
  }

  resetToBaseline(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.society.set(societySeed.society as Society);
    this.adminUser.set(societySeed.adminUser as User);
    this.memberUser.set(societySeed.memberUser as User);
    this.metrics.set(societySeed.metrics as MetricStats);
    this.collectionOverview.set(societySeed.collectionOverview as CollectionMonth[]);
    this.complaintStats.set(societySeed.complaintStats as ComplaintStats);
    this.recentActivities.set(operationsSeed.recentActivities as Activity[]);
    this.members.set(membersUnitsSeed.members as Member[]);
    this.units.set(membersUnitsSeed.units as Unit[]);
    this.invoices.set(billingSeed.invoices as Invoice[]);
    this.paymentHistory.set(billingSeed.paymentHistory as Payment[]);
    this.complaints.set(complaintsSeed.complaints as Complaint[]);
    this.notices.set(noticesAmenitiesSeed.notices as Notice[]);
    this.amenities.set(noticesAmenitiesSeed.amenities as Amenity[]);
    this.bookings.set(noticesAmenitiesSeed.bookings as Booking[]);
    this.documents.set(operationsSeed.documents as SocietyDocument[]);
    this.notifications.set(operationsSeed.notifications as AppNotification[]);
    this.visitors.set(operationsSeed.visitors as VisitorPass[]);
    this.polls.set(operationsSeed.polls as SocietyPoll[]);
    this.parkingSlots.set(operationsSeed.parkingSlots as ParkingSlot[]);
    this.auditLogs.set(operationsSeed.auditLogs as AuditLogEntry[]);
    this.setView('dashboard');
    this.hydrateFromApi(true);
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
        notifications: this.notifications(),
        visitors: this.visitors(),
        polls: this.polls(),
        parkingSlots: this.parkingSlots(),
        auditLogs: this.auditLogs()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  private loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
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
      if (data.visitors) this.visitors.set(data.visitors);
      if (data.polls) this.polls.set(data.polls);
      if (data.parkingSlots) this.parkingSlots.set(data.parkingSlots);
      if (data.auditLogs) this.auditLogs.set(data.auditLogs);
      this.dataSourceMode.set('local-storage-cache');
      return true;
    } catch (e) {
      console.warn('Could not parse from localStorage', e);
      return false;
    }
  }
}
