import { environment } from '../../../environments/environment';

/**
 * Enterprise API Endpoint Registry
 * Resolves either to `/assets/mock-data/*.json` (when `environment.useMockApi === true`)
 * or to `/api/v1/*` REST endpoints (when `environment.useMockApi === false`).
 */
export const API_ENDPOINTS = {
  societyOverview: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/society.json`
      : `${environment.apiBaseUrl}/society/overview`,

  membersAndUnits: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/members-units.json`
      : `${environment.apiBaseUrl}/society/directory`,

  billing: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/billing.json`
      : `${environment.apiBaseUrl}/billing/ledger`,

  complaints: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/complaints.json`
      : `${environment.apiBaseUrl}/complaints`,

  noticesAndAmenities: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/notices-amenities.json`
      : `${environment.apiBaseUrl}/facilities/overview`,

  operations: () =>
    environment.useMockApi
      ? `${environment.mockDataBaseUrl}/operations.json`
      : `${environment.apiBaseUrl}/operations/bootstrap`
  ,
  /** REST mutation endpoints used when `environment.useMockApi === false` */
  mutations: {
    authLogin: () => `${environment.apiBaseUrl}/auth/login`,
    authRegister: () => `${environment.apiBaseUrl}/auth/register`,
    authResetPassword: () => `${environment.apiBaseUrl}/auth/reset-password`,
    primaryProfile: () => `${environment.apiBaseUrl}/profile/primary`,
    familyMembers: () => `${environment.apiBaseUrl}/profile/family`,
    familyMemberById: (id: string) => `${environment.apiBaseUrl}/profile/family/${encodeURIComponent(id)}`,
    payInvoice: (id: string) => `${environment.apiBaseUrl}/billing/invoices/${encodeURIComponent(id)}/pay`,
    complaints: () => `${environment.apiBaseUrl}/complaints`,
    notices: () => `${environment.apiBaseUrl}/facilities/notices`,
    bookings: () => `${environment.apiBaseUrl}/facilities/bookings`
  }
} as const;

