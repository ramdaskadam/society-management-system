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
  AuditLogEntry,
  FamilyMember,
  PersonDetails,
  TenantRecord
} from '../models/society.model';
import { SocietyApiService, SocietyBootstrapPayload } from '../core/services/society-api.service';
import { ToastNotificationService } from '../core/services/toast-notification.service';
import { environment } from '../../environments/environment';

// Typed baseline JSON seed imports from `src/assets/mock-data/*.json`
import societySeed from '../../assets/mock-data/society.json';
import membersUnitsSeed from '../../assets/mock-data/members-units.json';
import billingSeed from '../../assets/mock-data/billing.json';
import complaintsSeed from '../../assets/mock-data/complaints.json';
import noticesAmenitiesSeed from '../../assets/mock-data/notices-amenities.json';
import operationsSeed from '../../assets/mock-data/operations.json';

export interface GlobalSearchResultItem {
  id: string;
  category:
    | 'Member'
    | 'Unit'
    | 'Invoice'
    | 'Complaint'
    | 'Notice'
    | 'Visitor'
    | 'Parking'
    | 'Poll'
    | 'Amenity'
    | 'Document';
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  targetView: string;
}

const SEED_TENANTS: TenantRecord[] = (membersUnitsSeed as { tenants?: TenantRecord[] }).tenants ?? [];
const SEED_FAMILY_MEMBERS: FamilyMember[] =
  (membersUnitsSeed as { familyMembers?: FamilyMember[] }).familyMembers ?? [];

const STORAGE_KEY = 'green_meadows_sms_angular_v2';

/** Human readable "today" (e.g. "05 Nov 2026") used instead of hardcoded demo dates. */
const todayLabel = (): string =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Collision-safe id generator: prefix + timestamp + counter (replaces Math.random ids). */
let idCounter = 0;
const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}`.toUpperCase();

/** True when the app talks to the real backend (so local cache must not shadow server data). */
const LIVE_API = !environment.useMockApi;

@Injectable({
  providedIn: 'root'
})
export class SocietyStateService {
  private readonly apiService = inject(SocietyApiService, { optional: true });
  private readonly toastService = inject(ToastNotificationService);
  private readonly router = inject(Router, { optional: true });

  // Observability & Loading Signals
  readonly isLoading = signal<boolean>(false);
  readonly dataSourceMode = signal<'mock-json-assets' | 'local-storage-cache' | 'live-api'>('mock-json-assets');
  /** Last backend load error (null when healthy). Views can show a retry banner from this. */
  readonly loadError = signal<string | null>(null);

  // Domain State Signals
  readonly society = signal<Society>(societySeed.society as Society);
  readonly currentUserRole = signal<UserRole>('admin');
  /** True when the logged-in resident is an approved Tenant (grants limited portal access). */
  readonly isTenantSession = signal<boolean>(false);
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

  /** Secondary members added by primary residents (all flats; filtered per flat below). */
  readonly familyMembers = signal<FamilyMember[]>(SEED_FAMILY_MEMBERS);
  /** Extra personal details of the primary resident (DOB, gender, photo...). Name/email/phone mirror `memberUser`. */
  readonly primaryExtras = signal<Partial<PersonDetails>>({});
  /** Tenants registered by flat owners (each tenant includes their own `familyMembers` list). */
  readonly tenants = signal<TenantRecord[]>(SEED_TENANTS);

  // Ephemeral UI Toasts (delegated to ToastNotificationService; excluded from localStorage)
  readonly toasts = this.toastService.toasts;

  // Selected invoice for receipt modal
  readonly selectedReceiptInvoice = signal<Invoice | null>(null);

  // Global Search State across Dashboard & Views
  readonly globalSearchQuery = signal<string>('');

  // ── Dynamic Computed Selectors (No Hardcoded Unit IDs) ────────────────────────
  /** Deduplicated list of registered owners for the Admin Add/Update Unit owner dropdown. */
  readonly availableOwnerNames = computed<string[]>(() => {
    const names = new Set<string>();
    this.members().forEach(m => {
      if (m.name?.trim()) names.add(m.name.trim());
    });
    this.units().forEach(u => {
      if (u.owner?.trim() && u.owner !== 'Unassigned') names.add(u.owner.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });

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

  /** Family members of the signed-in resident's flat. */
  readonly activeFamily = computed(() => {
    const unit = this.currentResidentUnit();
    return this.familyMembers().filter(f => f.unitNo === unit);
  });

  /** Tenants belonging to the current resident's flat (or all tenants for admin). */
  readonly activeUnitTenants = computed(() => {
    const unit = this.currentResidentUnit();
    return this.currentUserRole() === 'admin'
      ? this.tenants()
      : this.tenants().filter(t => t.unitNo === unit);
  });

  /** Full editable profile of the primary resident, built from `memberUser` + saved extras. */
  readonly primaryProfile = computed<PersonDetails>(() => {
    const u = this.memberUser();
    const parts = u.name.trim().split(/\s+/);
    const x = this.primaryExtras();
    return {
      firstName: x.firstName ?? parts[0] ?? '',
      middleName: x.middleName ?? (parts.length > 2 ? parts.slice(1, -1).join(' ') : ''),
      lastName: x.lastName ?? (parts.length > 1 ? parts[parts.length - 1] : ''),
      dob: x.dob ?? '',
      gender: x.gender ?? '',
      photo: u.avatar,
      qualification: x.qualification ?? '',
      mobile: u.phone ?? '',
      email: u.email,
      hasDisability: x.hasDisability ?? false,
      disabilityDetails: x.disabilityDetails ?? ''
    };
  });

  readonly activeUnitDues = computed(() => {
    const inv = this.activeUnitInvoices().find(i => i.status === 'Unpaid');
    return inv ? inv.amount : 0;
  });

  /** Alias preserved for backward compatibility */
  readonly memberA101Dues = this.activeUnitDues;

  /** Filtered recent activities for Admin Dashboard based on globalSearchQuery */
  readonly filteredRecentActivities = computed(() => {
    const q = this.globalSearchQuery().toLowerCase().trim();
    const list = this.recentActivities();
    if (!q) return list;
    return list.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        (a.amount && a.amount.toLowerCase().includes(q))
    );
  });

  /** Cross-module Global Search Results for Dashboard & Topbar Command Palette */
  readonly globalSearchResults = computed<GlobalSearchResultItem[]>(() => {
    const q = this.globalSearchQuery().toLowerCase().trim();
    if (!q) return [];

    const role = this.currentUserRole();
    const results: GlobalSearchResultItem[] = [];

    // 1. Members
    this.members().forEach(m => {
      if (
        m.name.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      ) {
        results.push({
          id: `mem-${m.id}`,
          category: 'Member',
          title: `${m.name} (${m.unit})`,
          subtitle: `${m.role} • Wing ${m.wing} • ${m.phone}`,
          badge: m.dues > 0 ? `Dues ₹${m.dues.toLocaleString('en-IN')}` : m.status,
          badgeClass: m.dues > 0 ? 'badge-unpaid' : 'badge-active',
          targetView: role === 'admin' ? 'members' : 'my-unit'
        });
      }
    });

    // 2. Units
    this.units().forEach(u => {
      if (
        u.unitNo.toLowerCase().includes(q) ||
        u.owner.toLowerCase().includes(q) ||
        u.type.toLowerCase().includes(q) ||
        u.occupancy.toLowerCase().includes(q)
      ) {
        results.push({
          id: `unit-${u.id}`,
          category: 'Unit',
          title: `Flat ${u.unitNo} (Wing ${u.wing})`,
          subtitle: `${u.owner} • ${u.type} (${u.area} sq.ft) • ${u.occupancy}`,
          badge: u.dues > 0 ? `₹${u.dues.toLocaleString('en-IN')} Due` : 'No Dues',
          badgeClass: u.dues > 0 ? 'badge-unpaid' : 'badge-paid',
          targetView: role === 'admin' ? 'units' : 'my-unit'
        });
      }
    });

    // 3. Invoices
    const invoicePool = role === 'admin' ? this.invoices() : this.activeUnitInvoices();
    invoicePool.forEach(inv => {
      if (
        inv.id.toLowerCase().includes(q) ||
        inv.unitNo.toLowerCase().includes(q) ||
        inv.memberName.toLowerCase().includes(q) ||
        inv.month.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      ) {
        results.push({
          id: `inv-${inv.id}`,
          category: 'Invoice',
          title: `${inv.id} • ${inv.month}`,
          subtitle: `${inv.memberName} (${inv.unitNo}) • ₹${inv.amount.toLocaleString('en-IN')}`,
          badge: inv.status,
          badgeClass: inv.status === 'Paid' ? 'badge-paid' : 'badge-unpaid',
          targetView: 'payments'
        });
      }
    });

    // 4. Complaints
    const complaintPool = role === 'admin' ? this.complaints() : this.activeUnitComplaints();
    complaintPool.forEach(c => {
      if (
        c.id.toLowerCase().includes(q) ||
        c.ticketNo.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.unitNo.toLowerCase().includes(q) ||
        c.reportedBy.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
      ) {
        results.push({
          id: `cmp-${c.id}`,
          category: 'Complaint',
          title: `${c.ticketNo}: ${c.subject}`,
          subtitle: `${c.category} • Flat ${c.unitNo} (${c.reportedBy})`,
          badge: c.status,
          badgeClass:
            c.status === 'Resolved' || c.status === 'Closed'
              ? 'badge-resolved'
              : c.status === 'In Progress'
                ? 'badge-in-progress'
                : 'badge-open',
          targetView: 'complaints'
        });
      }
    });

    // 5. Notices
    this.notices().forEach(n => {
      if (
        n.title.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        (n.location && n.location.toLowerCase().includes(q))
      ) {
        results.push({
          id: `not-${n.id}`,
          category: 'Notice',
          title: n.title,
          subtitle: `${n.category} • ${n.publishDate}${n.location ? ' • ' + n.location : ''}`,
          badge: n.category,
          badgeClass: 'badge-info',
          targetView: 'notices'
        });
      }
    });

    // 6. Visitors & Gate Passes
    const visitorPool = role === 'admin' ? this.visitors() : this.activeUnitVisitors();
    visitorPool.forEach(v => {
      if (
        v.visitorName.toLowerCase().includes(q) ||
        v.passCode.toLowerCase().includes(q) ||
        v.unitNo.toLowerCase().includes(q) ||
        v.visitorType.toLowerCase().includes(q) ||
        (v.company && v.company.toLowerCase().includes(q))
      ) {
        results.push({
          id: `vis-${v.id}`,
          category: 'Visitor',
          title: `${v.visitorName} (${v.visitorType})`,
          subtitle: `Flat ${v.unitNo} • OTP: ${v.passCode} • ${v.company || 'Guest'}`,
          badge: v.status,
          badgeClass: v.status === 'Inside Premises' ? 'badge-paid' : 'badge-info',
          targetView: 'visitors'
        });
      }
    });

    // 7. Parking & Vehicles
    this.parkingSlots().forEach(p => {
      if (
        p.slotNo.toLowerCase().includes(q) ||
        p.vehicleNo.toLowerCase().includes(q) ||
        p.unitNo.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.vehicleType.toLowerCase().includes(q)
      ) {
        results.push({
          id: `pk-${p.id}`,
          category: 'Parking',
          title: `Bay ${p.slotNo} • ${p.vehicleNo || 'Vacant'}`,
          subtitle: `${p.ownerName} (${p.unitNo}) • ${p.vehicleType}`,
          badge: p.type,
          badgeClass: p.type === 'EV Charging Bay' ? 'badge-paid' : 'badge-info',
          targetView: 'parking'
        });
      }
    });

    // 8. Polls
    this.polls().forEach(pl => {
      if (
        pl.title.toLowerCase().includes(q) ||
        pl.category.toLowerCase().includes(q) ||
        pl.description.toLowerCase().includes(q)
      ) {
        results.push({
          id: `poll-${pl.id}`,
          category: 'Poll',
          title: pl.title,
          subtitle: `${pl.category} • ${pl.totalVotes} votes cast`,
          badge: pl.status,
          badgeClass: pl.status === 'Active' ? 'badge-active' : 'badge-closed',
          targetView: 'polls'
        });
      }
    });

    // 9. Amenities & Documents
    this.amenities().forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
        results.push({
          id: `am-${a.id}`,
          category: 'Amenity',
          title: a.name,
          subtitle: `${a.timings} • ${a.charge}`,
          badge: a.available ? 'Available' : 'Maintenance',
          badgeClass: 'badge-confirmed',
          targetView: 'amenities'
        });
      }
    });

    this.documents().forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        results.push({
          id: `doc-${d.id}`,
          category: 'Document',
          title: d.title,
          subtitle: `${d.category} • ${d.size} • ${d.date}`,
          badge: 'PDF',
          badgeClass: 'badge-info',
          targetView: 'documents'
        });
      }
    });

    return results;
  });

  setGlobalSearch(query: string): void {
    this.globalSearchQuery.set(query);
  }

  clearGlobalSearch(): void {
    this.globalSearchQuery.set('');
  }

  constructor() {
    // Startup flow:
    //  - Live backend: ALWAYS fetch from the API (server is the source of truth, no stale cache).
    //  - Mock mode: reuse the browser cache if present so demo edits survive a refresh.
    const hasLocalCache = LIVE_API ? false : this.loadFromStorage();
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
    this.loadError.set(null);

    // Loads all domain endpoints in parallel and pushes them into the signals below.
    this.apiService.fetchBootstrapBundle().subscribe({
      next: (bundle: SocietyBootstrapPayload) => {
        this.applyBootstrapPayload(bundle);
        this.dataSourceMode.set(LIVE_API ? 'live-api' : 'mock-json-assets');
        this.isLoading.set(false);
        if (notifyUser) {
          this.showToast(LIVE_API ? 'msg.dataRefreshed' : 'msg.baselineReloaded', 'info');
        }
      },
      error: err => {
        // Keep whatever data is on screen, but tell the user and allow a retry via hydrateFromApi().
        this.isLoading.set(false);
        this.loadError.set(err?.message || 'Unable to reach the server');
        this.showToast('msg.loadFailed', 'danger');
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
    if (bundle.directory.familyMembers) {
      this.familyMembers.set(bundle.directory.familyMembers);
    }
    if (bundle.directory.tenants) {
      this.tenants.set(bundle.directory.tenants);
    }

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
    this.showToast(role === 'admin' ? 'msg.switchedAdmin' : 'msg.switchedMember', 'info');
  }

  setView(view: string): void {
    this.currentView.set(view);
    this.router?.navigate(['/' + view]);
  }

  /** Shows a toast; pass a 'msg.*' dictionary key (+ params) or plain text. */
  showToast(message: string, type: ToastMessage['type'] = 'info', params?: Record<string, string | number>): void {
    this.toastService.showToast(message, type, params);
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
              paidOn: todayLabel(),
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
      date: todayLabel(),
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
      subtitle: `Maintenance dues (${paymentMethod})`,
      amount: `₹${amount.toLocaleString('en-IN')}`,
      time: 'Just now',
      timestamp: Date.now(),
      icon: 'payment'
    };
    this.recentActivities.update(list => [newActivity, ...list]);

    const updated = this.invoices().find(i => i.id === invoiceId) || null;
    this.selectedReceiptInvoice.set(updated);
    this.logAudit('Billing', `Invoice ${invoiceId} paid via ${paymentMethod} (Txn: ${txnId}).`);
    this.showToast('msg.paymentConfirmed', 'success', { amount: amount.toLocaleString('en-IN'), method: paymentMethod });
  }

  // ── Family (secondary members) & primary profile ─────────────────────────────
  /** Primary member updates his/her own details; name/email/phone/photo are mirrored to the user record. */
  updatePrimaryProfile(d: PersonDetails): void {
    const name = [d.firstName, d.middleName, d.lastName].map(p => (p ?? '').trim()).filter(Boolean).join(' ');
    this.primaryExtras.set({ ...d });
    this.memberUser.update(u => ({
      ...u,
      name,
      email: d.email?.trim() || u.email,
      phone: d.mobile?.trim() || u.phone,
      avatar: d.photo || u.avatar
    }));
    if (LIVE_API) { this.apiService?.savePrimaryProfile(d).subscribe(); }
    this.logAudit('Profile', `Primary member profile updated (${name}).`);
    this.showToast('msg.profileUpdated', 'success');
  }

  addFamilyMember(d: PersonDetails, relation: string): void {
    const unitNo = this.currentResidentUnit();
    const member: FamilyMember = { ...d, id: uid('FAM'), unitNo, relation, addedOn: todayLabel() };
    this.familyMembers.update(list => [...list, member]);
    this.syncOccupants();
    if (LIVE_API) { this.apiService?.createFamilyMember(member).subscribe(); }
    this.logAudit('Profile', `Family member ${d.firstName} ${d.lastName} (${relation}) added to ${unitNo}.`);
    this.showToast('msg.familyAdded', 'success', { name: d.firstName });
  }

  updateFamilyMember(id: string, d: PersonDetails, relation: string): void {
    this.familyMembers.update(list => list.map(f => (f.id === id ? { ...f, ...d, relation } : f)));
    if (LIVE_API) { this.apiService?.updateFamilyMember(id, { ...d, relation }).subscribe(); }
    this.logAudit('Profile', `Family member ${d.firstName} ${d.lastName} updated.`);
    this.showToast('msg.familyUpdated', 'success', { name: d.firstName });
  }

  removeFamilyMember(id: string): void {
    const m = this.familyMembers().find(f => f.id === id);
    if (!m) return;
    this.familyMembers.update(list => list.filter(f => f.id !== id));
    this.syncOccupants();
    if (LIVE_API) { this.apiService?.deleteFamilyMember(id).subscribe(); }
    this.logAudit('Profile', `Family member ${m.firstName} ${m.lastName} removed from ${m.unitNo}.`);
    this.showToast('msg.familyRemoved', 'info', { name: m.firstName });
  }

  /** Occupants = primary member + family members of the flat. */
  private syncOccupants(): void {
    const count = 1 + this.activeFamily().length;
    this.memberUser.update(u => ({ ...u, occupants: count }));
  }

  /** Syncs flat occupancy status when tenants are added/updated/deleted. */
  private syncUnitTenantStatus(unitNo: string): void {
    const hasActiveTenant = this.tenants().some(t => t.unitNo === unitNo && t.status === 'Active');
    this.units.update(list =>
      list.map(u => (u.unitNo === unitNo ? { ...u, occupancy: hasActiveTenant ? 'Tenant Occupied' : 'Owner Occupied' } : u))
    );
  }

  addTenant(
    d: PersonDetails,
    lease: { leaseStart: string; leaseEnd: string; monthlyRent?: number; policeVerified: boolean; status: 'Active' | 'Past' }
  ): void {
    const unitNo = this.currentResidentUnit();
    const tenant: TenantRecord = {
      ...d,
      id: uid('TEN'),
      unitNo,
      leaseStart: lease.leaseStart,
      leaseEnd: lease.leaseEnd,
      monthlyRent: lease.monthlyRent,
      policeVerified: lease.policeVerified,
      status: lease.status,
      addedOn: todayLabel(),
      familyMembers: []
    };
    this.tenants.update(list => [tenant, ...list]);
    this.syncUnitTenantStatus(unitNo);
    if (LIVE_API) { this.apiService?.createTenant(tenant).subscribe(); }
    this.logAudit('Profile', `Tenant ${d.firstName} ${d.lastName} added for Unit ${unitNo}.`);
    this.showToast('msg.tenantAdded', 'success', { name: `${d.firstName} ${d.lastName}` });
  }

  updateTenant(
    id: string,
    d: PersonDetails,
    lease: { leaseStart: string; leaseEnd: string; monthlyRent?: number; policeVerified: boolean; status: 'Active' | 'Past' }
  ): void {
    let unitNo = this.currentResidentUnit();
    this.tenants.update(list =>
      list.map(t => {
        if (t.id !== id || t.status === 'Past') return t;
        unitNo = t.unitNo;
        return { ...t, ...d, ...lease };
      })
    );
    this.syncUnitTenantStatus(unitNo);
    if (LIVE_API) { this.apiService?.updateTenant(id, { ...d, ...lease }).subscribe(); }
    this.logAudit('Profile', `Tenant ${d.firstName} ${d.lastName} updated for Unit ${unitNo}.`);
    this.showToast('msg.tenantUpdated', 'success', { name: `${d.firstName} ${d.lastName}` });
  }

  /** Marks an active tenant's lease as completed ('Past') so they remain in the flat's tenant history. */
  endTenancy(id: string): void {
    const t = this.tenants().find(x => x.id === id);
    if (!t) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const leaseEnd = t.leaseEnd && t.leaseEnd <= todayIso ? t.leaseEnd : todayIso;
    this.tenants.update(list =>
      list.map(x => (x.id === id ? { ...x, status: 'Past', leaseEnd } : x))
    );
    this.syncUnitTenantStatus(t.unitNo);
    if (LIVE_API) { this.apiService?.updateTenant(id, { status: 'Past', leaseEnd }).subscribe(); }
    this.logAudit('Profile', `Lease ended for tenant ${t.firstName} ${t.lastName} (Unit ${t.unitNo}).`);
    this.showToast('msg.tenantEnded', 'info', { name: `${t.firstName} ${t.lastName}` });
  }

  deleteTenant(id: string): void {
    const t = this.tenants().find(x => x.id === id);
    if (!t) return;
    this.tenants.update(list => list.filter(x => x.id !== id));
    this.syncUnitTenantStatus(t.unitNo);
    if (LIVE_API) { this.apiService?.deleteTenant(id).subscribe(); }
    this.logAudit('Profile', `Tenant ${t.firstName} ${t.lastName} removed from Unit ${t.unitNo}.`);
    this.showToast('msg.tenantRemoved', 'info', { name: `${t.firstName} ${t.lastName}` });
  }

  addTenantFamilyMember(tenantId: string, d: PersonDetails, relation: string): void {
    const member: FamilyMember = {
      ...d,
      id: uid('TFAM'),
      unitNo: this.currentResidentUnit(),
      relation,
      addedOn: todayLabel()
    };
    this.tenants.update(list =>
      list.map(t => (t.id === tenantId && t.status === 'Active' ? { ...t, familyMembers: [...t.familyMembers, member] } : t))
    );
    const updated = this.tenants().find(t => t.id === tenantId);
    if (LIVE_API && updated) { this.apiService?.updateTenant(tenantId, { familyMembers: updated.familyMembers }).subscribe(); }
    this.logAudit('Profile', `Tenant family member ${d.firstName} ${d.lastName} (${relation}) added.`);
    this.showToast('msg.familyAdded', 'success', { name: d.firstName });
  }

  updateTenantFamilyMember(tenantId: string, familyId: string, d: PersonDetails, relation: string): void {
    this.tenants.update(list =>
      list.map(t =>
        t.id === tenantId && t.status === 'Active'
          ? {
              ...t,
              familyMembers: t.familyMembers.map(f => (f.id === familyId ? { ...f, ...d, relation } : f))
            }
          : t
      )
    );
    const updated = this.tenants().find(t => t.id === tenantId);
    if (LIVE_API && updated) { this.apiService?.updateTenant(tenantId, { familyMembers: updated.familyMembers }).subscribe(); }
    this.logAudit('Profile', `Tenant family member ${d.firstName} ${d.lastName} updated.`);
    this.showToast('msg.familyUpdated', 'success', { name: d.firstName });
  }

  removeTenantFamilyMember(tenantId: string, familyId: string): void {
    let removedName = '';
    this.tenants.update(list =>
      list.map(t => {
        if (t.id !== tenantId || t.status === 'Past') return t;
        const target = t.familyMembers.find(f => f.id === familyId);
        if (target) removedName = target.firstName;
        return { ...t, familyMembers: t.familyMembers.filter(f => f.id !== familyId) };
      })
    );
    const updated = this.tenants().find(t => t.id === tenantId);
    if (LIVE_API && updated) { this.apiService?.updateTenant(tenantId, { familyMembers: updated.familyMembers }).subscribe(); }
    this.logAudit('Profile', `Tenant family member ${removedName} removed.`);
    this.showToast('msg.familyRemoved', 'info', { name: removedName || 'Member' });
  }

  // ── Complaints & SLA Management ───────────────────────────────────────────────
  raiseComplaint(data: { category: string; priority: Complaint['priority']; subject: string; description: string }): void {
    // Next ticket number = highest existing number + 1 (length-based numbering could collide)
    const maxNo = this.complaints().reduce((max, c) => Math.max(max, parseInt(c.ticketNo.replace(/\D/g, ''), 10) || 0), 0);
    const tNo = `C-${maxNo + 1}`;
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
    this.showToast('msg.complaintRaised', 'success', { no: tNo });
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
    this.showToast('msg.complaintStatus', 'info', { id, status: newStatus });
  }

  // ── Notices & Amenities ───────────────────────────────────────────────────────
  publishNotice(data: { title: string; category: string; meetingDate?: string; location?: string; summary: string; pinned: boolean }): void {
    const newNotice: Notice = {
      id: `NOT-${Date.now()}`,
      title: data.title,
      category: data.category,
      publishDate: todayLabel(),
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
    this.showToast('msg.noticePublished', 'success');
  }

  bookAmenity(data: { amenity: string; date: string; time: string; purpose: string }): void {
    const unitNo = this.currentResidentUnit();
    const bookedBy = this.memberUser().name;
    const charge = data.amenity.includes('Hall') ? '₹2,500' : data.amenity.includes('Club') ? '₹1,000' : 'Free';
    const newBooking: Booking = {
      id: uid('BK'),
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

    this.showToast('msg.amenityBooked', 'success', { amenity: data.amenity });
  }

  approveBooking(bookingId: string): void {
    this.bookings.update(list => list.map(b => (b.id === bookingId ? { ...b, status: 'Confirmed' } : b)));
    this.showToast('msg.bookingApproved', 'success', { id: bookingId });
  }

  // ── Directory & Bulk Operations ───────────────────────────────────────────────
  addMember(data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    name: string;
    gender?: 'Male' | 'Female' | 'Other' | '';
    dob?: string;
    unit?: string;
    role: string;
    email: string;
    phone: string;
  }): void {
    const unitVal = data.unit?.trim() || 'Unassigned';
    const wingVal = unitVal !== 'Unassigned' ? unitVal[0]?.toUpperCase() || 'A' : '-';
    const newMember: Member = {
      id: uid('M'),
      name: data.name,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      dob: data.dob,
      unit: unitVal,
      wing: wingVal,
      role: data.role,
      email: data.email,
      phone: data.phone,
      status: 'Active',
      dues: 0
    };

    this.members.update(list => [...list, newMember]);
    this.metrics.update(m => ({ ...m, totalMembers: m.totalMembers + 1 }));
    this.showToast('msg.memberAdded', 'success', { name: data.name, unit: unitVal });
  }

  addUnit(data: {
    unitNo: string;
    wing: string;
    type: string;
    area: number;
    owner: string;
    occupancy?: string;
    documentsVerified?: boolean;
  }): void {
    if (this.units().some(u => u.unitNo.toLowerCase() === data.unitNo.trim().toLowerCase())) {
      this.showToast('msg.unitExists', 'danger', { unit: data.unitNo });
      return;
    }
    const unitNo = data.unitNo.trim().toUpperCase();
    const newUnit: Unit = {
      id: `U-${unitNo}`,
      unitNo,
      wing: data.wing,
      // Floor from the numeric part of the unit no: A-101 -> 1, B-1204 -> 12
      floor: Math.floor((parseInt(unitNo.replace(/\D/g, ''), 10) || 100) / 100) || 1,
      type: data.type,
      area: Number(data.area) || 1200,
      owner: data.owner,
      ownerSince: todayLabel(),
      occupancy: data.occupancy || 'Owner Occupied',
      dues: 0,
      documentsVerified: data.documentsVerified ?? true,
      pastOwners: []
    };

    this.units.update(list => [...list, newUnit]);
    // Assign flat to respective owner in members directory if present
    this.members.update(list =>
      list.map(m => (m.name === data.owner ? { ...m, unit: unitNo, wing: data.wing } : m))
    );
    this.metrics.update(m => ({ ...m, totalUnits: m.totalUnits + 1 }));
    this.logAudit('Settings', `Added unit ${unitNo} assigned to owner ${data.owner}.`);
    this.showToast('msg.unitAdded', 'success', { unit: unitNo });
  }

  /**
   * Updates unit info and assigns the flat to the selected owner.
   * When the owner changes, the previous owner is automatically recorded in `unit.pastOwners`.
   */
  updateUnit(
    id: string,
    data: {
      unitNo: string;
      wing: string;
      floor?: number;
      type: string;
      area: number;
      owner: string;
      occupancy: string;
      documentsVerified?: boolean;
    }
  ): void {
    const existing = this.units().find(u => u.id === id);
    if (!existing) return;

    const unitNo = data.unitNo.trim().toUpperCase();
    const computedFloor =
      data.floor && data.floor > 0
        ? Number(data.floor)
        : Math.floor((parseInt(unitNo.replace(/\D/g, ''), 10) || 100) / 100) || existing.floor;

    let pastOwners = [...(existing.pastOwners ?? [])];
    let ownerSince = existing.ownerSince || '01 Jan 2020';

    if (existing.owner && existing.owner !== 'Unassigned' && existing.owner !== data.owner) {
      const prevMember = this.members().find(m => m.name.toLowerCase() === existing.owner.toLowerCase());
      pastOwners = [
        {
          id: uid('PO'),
          ownerName: existing.owner,
          email: prevMember?.email,
          phone: prevMember?.phone,
          fromDate: ownerSince,
          toDate: todayLabel()
        },
        ...pastOwners
      ];
      ownerSince = todayLabel();
    }

    this.units.update(list =>
      list.map(u =>
        u.id === id
          ? {
              ...u,
              unitNo,
              wing: data.wing,
              floor: computedFloor,
              type: data.type,
              area: Number(data.area) || u.area,
              owner: data.owner,
              ownerSince,
              occupancy: data.occupancy,
              documentsVerified: data.documentsVerified ?? u.documentsVerified ?? true,
              pastOwners
            }
          : u
      )
    );

    // Sync assigned flat with the owner's record in the Members directory
    this.members.update(list =>
      list.map(m => (m.name === data.owner ? { ...m, unit: unitNo, wing: data.wing } : m))
    );

    this.logAudit('Settings', `Updated unit ${unitNo} (Assigned Owner: ${data.owner}).`);
    this.showToast('msg.unitUpdated', 'success', { unit: unitNo, owner: data.owner });
  }

  generateBulkInvoices(): void {
    // Figures are derived from live data (unit count x configured rate) instead of fixed demo numbers.
    const rate = this.society().maintenancePerSqFt || 0;
    const units = this.units();
    const billed = Math.round(units.reduce((sum, u) => sum + u.area * rate, 0));
    const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    this.metrics.update(m => ({ ...m, pendingDues: m.pendingDues + billed }));

    this.notifications.update(list => [
      {
        id: uid('NTF'),
        title: 'Bulk Invoices Issued',
        text: `${month} maintenance invoices issued to all ${units.length} units.`,
        time: 'Just now',
        read: false,
        type: 'billing'
      },
      ...list
    ]);

    this.logAudit('Billing', `Generated monthly maintenance invoices for ${units.length} units.`);
    this.showToast('msg.invoicesIssued', 'success', { count: units.length });
  }

  markNotificationsAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.showToast('msg.notificationsRead', 'info');
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
        csvContent += `${i.unitNo},"${i.memberName}",${Math.round(i.amount * 0.7)},${Math.round(i.amount * 0.3)},${i.amount},${i.status}\n`;
      });
      filename = 'maintenance_collections.csv';
    }

    // Blob download works for any size/characters (data: URIs break on '#' and large files)
    const blob = new Blob([csvContent.replace('data:text/csv;charset=utf-8,', '')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('msg.exported', 'success', { file: filename });
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
      id: uid('VIS'),
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
    this.showToast('msg.gatePass', 'success', { code: passCode, name: data.visitorName });
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
    this.showToast('msg.visitorStatus', 'info', { id, status });
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
    this.showToast('msg.voteRecorded', 'success');
  }

  createPoll(data: {
    title: string;
    description: string;
    category: SocietyPoll['category'];
    endDate: string;
    options: string[];
  }): void {
    const newPoll: SocietyPoll = {
      id: uid('POLL'),
      title: data.title,
      description: data.description,
      category: data.category,
      createdBy: this.activeUser().name,
      endDate: data.endDate || todayLabel(),
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
    this.showToast('msg.pollPublished', 'success', { title: data.title });
  }

  closePoll(pollId: string): void {
    this.polls.update(list => list.map(p => (p.id === pollId ? { ...p, status: 'Closed' } : p)));
    this.logAudit('Governance', `Closed voting for poll ${pollId}.`);
    this.showToast('msg.pollClosed', 'info', { id: pollId });
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
      id: uid('PK'),
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
    this.showToast('msg.vehicleRegistered', 'success', { vehicle: newSlot.vehicleNo, slot: data.slotNo });
  }

  // ── Complaint Rating, Document Upload & Settings ──────────────────────────────
  rateComplaint(complaintId: string, rating: number): void {
    this.complaints.update(list => list.map(c => (c.id === complaintId ? { ...c, rating } : c)));
    this.showToast('msg.complaintRated', 'success', { id: complaintId, rating });
  }

  uploadDocument(data: { title: string; category: string; access: string }): void {
    const newDoc: SocietyDocument = {
      id: uid('DOC'),
      title: data.title,
      category: data.category,
      size: '1.5 MB',
      date: todayLabel(),
      access: data.access
    };
    this.documents.update(list => [newDoc, ...list]);
    this.logAudit('Settings', `Uploaded society document "${data.title}" (${data.category}).`);
    this.showToast('msg.documentUploaded', 'success', { title: data.title });
  }

  updateSocietySettings(data: Partial<Society>): void {
    this.society.update(curr => ({ ...curr, ...data }));
    this.logAudit('Settings', 'Updated society billing & configuration parameters.');
    this.showToast('msg.settingsSaved', 'success');
  }

  logAudit(module: AuditLogEntry['module'], details: string, action?: string): void {
    const entry: AuditLogEntry = {
      id: uid('AUD'),
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
    this.familyMembers.set(SEED_FAMILY_MEMBERS);
    this.primaryExtras.set({});
    this.tenants.set(SEED_TENANTS);
    this.setView('dashboard');
    this.hydrateFromApi(true);
  }

  private saveToStorage(): void {
    if (LIVE_API) return; // server owns the data in live mode
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
        auditLogs: this.auditLogs(),
        familyMembers: this.familyMembers(),
        primaryExtras: this.primaryExtras(),
        tenants: this.tenants(),
        memberUser: this.memberUser()
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
      if (data.units) {
        const seedMap = new Map((membersUnitsSeed.units as Unit[]).map(u => [u.unitNo, u]));
        this.units.set(
          (data.units as Unit[]).map(u => ({
            ...u,
            ownerSince: u.ownerSince ?? seedMap.get(u.unitNo)?.ownerSince ?? '01 Jan 2020',
            pastOwners: u.pastOwners?.length ? u.pastOwners : (seedMap.get(u.unitNo)?.pastOwners ?? [])
          }))
        );
      }
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
      if (data.familyMembers) this.familyMembers.set(data.familyMembers);
      if (data.primaryExtras) this.primaryExtras.set(data.primaryExtras);
      if (data.tenants && data.tenants.length) {
        const hasActiveSeed = data.tenants.some((t: TenantRecord) => t.id === 'TEN-ACT-01' || t.status === 'Active');
        this.tenants.set(
          hasActiveSeed || !SEED_TENANTS.length ? data.tenants : [SEED_TENANTS[0], ...data.tenants]
        );
      }
      if (data.memberUser) this.memberUser.set(data.memberUser);
      this.dataSourceMode.set('local-storage-cache');
      return true;
    } catch (e) {
      console.warn('Could not parse from localStorage', e);
      return false;
    }
  }
}
