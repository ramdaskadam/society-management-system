import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { API_ENDPOINTS } from '../config/api-endpoints.config';
import {
  Society,
  User,
  MetricStats,
  CollectionMonth,
  ComplaintStats,
  Member,
  Unit,
  Invoice,
  Payment,
  Complaint,
  Notice,
  Amenity,
  Booking,
  Activity,
  SocietyDocument,
  AppNotification,
  VisitorPass,
  SocietyPoll,
  ParkingSlot,
  AuditLogEntry,
  FamilyMember,
  PersonDetails,
  TenantRecord
} from '../../models/society.model';

export interface SocietyOverviewResponse {
  society: Society;
  adminUser: User;
  memberUser: User;
  metrics: MetricStats;
  collectionOverview: CollectionMonth[];
  complaintStats: ComplaintStats;
}

export interface MembersUnitsResponse {
  members: Member[];
  units: Unit[];
}

export interface BillingResponse {
  invoices: Invoice[];
  paymentHistory: Payment[];
}

export interface ComplaintsResponse {
  complaints: Complaint[];
}

export interface NoticesAmenitiesResponse {
  notices: Notice[];
  amenities: Amenity[];
  bookings: Booking[];
}

export interface OperationsResponse {
  recentActivities: Activity[];
  documents: SocietyDocument[];
  notifications: AppNotification[];
  visitors: VisitorPass[];
  polls: SocietyPoll[];
  parkingSlots: ParkingSlot[];
  auditLogs: AuditLogEntry[];
}

export interface SocietyBootstrapPayload {
  overview: SocietyOverviewResponse;
  directory: MembersUnitsResponse;
  billing: BillingResponse;
  complaints: ComplaintsResponse;
  facilities: NoticesAmenitiesResponse;
  operations: OperationsResponse;
}

/**
 * Enterprise Data Access / API Repository Service
 * Performs HTTP calls against `/assets/mock-data/*.json` (in mock mode)
 * or `/api/v1/*` (in production mode) via Angular `HttpClient`.
 */
@Injectable({
  providedIn: 'root'
})
export class SocietyApiService {
  private readonly http = inject(HttpClient);

  getSocietyOverview(): Observable<SocietyOverviewResponse> {
    return this.http.get<SocietyOverviewResponse>(API_ENDPOINTS.societyOverview());
  }

  getMembersAndUnits(): Observable<MembersUnitsResponse> {
    return this.http.get<MembersUnitsResponse>(API_ENDPOINTS.membersAndUnits());
  }

  getBillingLedger(): Observable<BillingResponse> {
    return this.http.get<BillingResponse>(API_ENDPOINTS.billing());
  }

  getComplaints(): Observable<ComplaintsResponse> {
    return this.http.get<ComplaintsResponse>(API_ENDPOINTS.complaints());
  }

  getNoticesAndAmenities(): Observable<NoticesAmenitiesResponse> {
    return this.http.get<NoticesAmenitiesResponse>(API_ENDPOINTS.noticesAndAmenities());
  }

  getOperationsData(): Observable<OperationsResponse> {
    return this.http.get<OperationsResponse>(API_ENDPOINTS.operations());
  }

  /**
   * Executes parallel HTTP GET requests across all domain JSON endpoints
   * to hydrate the application state store.
   */
  fetchBootstrapBundle(): Observable<SocietyBootstrapPayload> {
    return forkJoin({
      overview: this.getSocietyOverview(),
      directory: this.getMembersAndUnits(),
      billing: this.getBillingLedger(),
      complaints: this.getComplaints(),
      facilities: this.getNoticesAndAmenities(),
      operations: this.getOperationsData()
    });
  }

  // ── Backend Mutation Endpoints (used when environment.useMockApi === false) ──
  savePrimaryProfile(details: PersonDetails): Observable<PersonDetails> {
    return this.http.put<PersonDetails>(API_ENDPOINTS.mutations.primaryProfile(), details);
  }

  createFamilyMember(member: FamilyMember): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(API_ENDPOINTS.mutations.familyMembers(), member);
  }

  updateFamilyMember(id: string, member: Partial<FamilyMember>): Observable<FamilyMember> {
    return this.http.put<FamilyMember>(API_ENDPOINTS.mutations.familyMemberById(id), member);
  }

  deleteFamilyMember(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.mutations.familyMemberById(id));
  }

  createTenant(tenant: TenantRecord): Observable<TenantRecord> {
    return this.http.post<TenantRecord>(API_ENDPOINTS.mutations.tenants(), tenant);
  }

  updateTenant(id: string, tenant: Partial<TenantRecord>): Observable<TenantRecord> {
    return this.http.put<TenantRecord>(API_ENDPOINTS.mutations.tenantById(id), tenant);
  }

  deleteTenant(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.mutations.tenantById(id));
  }
}
