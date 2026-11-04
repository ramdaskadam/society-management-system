# Green Meadows — Society Management System (Enterprise Angular 18 Frontend)

An enterprise-structured residential community portal built with **Angular 18 Standalone Components**, **Angular Signals**, and a layered **Core / API Repository / Mock JSON Asset** architecture.

For the complete Software Requirements Specification and full-stack architecture diagrams, see [`../society-management-system-requirements.md`](../society-management-system-requirements.md).

## Enterprise Layered Architecture

1. **Environment Configuration (`src/environments/`)**:
   - `environment.ts` (development) sets `useMockApi: true` and `mockDataBaseUrl: '/assets/mock-data'`.
   - `environment.prod.ts` (production) sets `useMockApi: false` and `apiBaseUrl: '/api/v1'`.
2. **Modular JSON Mock Data (`public/assets/mock-data/` & `src/assets/mock-data/`)**:
   - `society.json` — Society configuration, Admin/Member user profiles, KPI metrics, and chart series.
   - `members-units.json` — Resident directory and flat/unit inventory.
   - `billing.json` — Maintenance invoices and confirmed payment history.
   - `complaints.json` — Helpdesk service requests, SLA statuses, and star ratings.
   - `notices-amenities.json` — Official notices, bookable amenities, and facility reservations.
   - `operations.json` — Visitor & Gate OTP passes, community polls, parking/EV bays, documents, notifications, audit logs, and recent activities.
3. **Multi-Language i18n (`public/assets/i18n/` & `src/app/core/services/i18n.service.ts`)**:
   - Runtime language switching across **English (`en`)**, **Hindi (`hi` — हिंदी)**, and **Marathi (`mr` — मराठी)** without page reloads.
   - Uses `I18nService` and the standalone `TranslatePipe` (`{{ 'nav.dashboard' | t }}`) with `{{param}}` interpolation and `<html lang="...">` accessibility synchronization.
4. **Core Infrastructure Layer (`src/app/core/`)**:
   - `config/api-endpoints.config.ts` — Strongly-typed endpoint registry resolving either `/assets/mock-data/*.json` or `/api/v1/*`.
   - `interceptors/api.interceptor.ts` — Functional `HttpInterceptorFn` injecting `X-Society-Tenant-ID`, `X-Client-Version`, and `Authorization: Bearer` headers.
   - `guards/role.guard.ts` — Functional `CanActivateFn` enforcing role-based route access (`admin` vs. `member`).
   - `services/society-api.service.ts` — `HttpClient` repository service using `forkJoin` to fetch all domain JSON endpoints in parallel.
4. **Reactive State Store (`src/app/services/society-state.service.ts`)**:
   - Hydrates state from `SocietyApiService` (`HttpClient`) and synchronizes user mutations with `localStorage`.

## Development Commands

- **Start dev server**: `npm start` (`http://localhost:4200/`)
- **Typecheck & AOT template check**: `./node_modules/.bin/ngc -p tsconfig.app.json --noEmit`
- **Production build**: `npm run build`
