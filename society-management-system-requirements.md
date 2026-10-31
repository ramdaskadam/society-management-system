# Society Management System --- Software Requirements Specification

**Document version:** 1.0\
**Status:** Initial baseline requirements\
**Product type:** Web-based digital platform for residential societies /
housing communities

------------------------------------------------------------------------

## 1. Purpose

The Society Management System (SMS) is a centralized digital platform
for residential society members and society administrators. It will
digitize day-to-day society operations, improve communication and
transparency, simplify maintenance collection and complaint handling,
and provide administrators with reliable operational records.

The platform will initially support two primary user roles:

-   **Society Member:** A resident or an authorized owner/tenant who
    uses the platform to view society information, pay dues, raise
    requests, receive notices, and manage their household profile.
-   **Society Admin:** An authorized committee member or
    property-management employee who configures the society, manages
    members and units, tracks payments, handles complaints, publishes
    notices, and monitors operations.

The system should be designed so additional roles---such as security
staff, facility managers, accountants, and super administrators---can be
introduced later.

## 2. Goals and Objectives

1.  Provide a single digital portal for society members and
    administrators.
2.  Maintain accurate records of buildings, wings, units, owners,
    tenants, and occupancy.
3.  Publish notices, announcements, and important documents.
4.  Generate and track maintenance bills, payments, receipts, and
    outstanding balances.
5.  Allow members to submit complaints and service requests and track
    their resolution.
6.  Manage amenities and common-area bookings.
7.  Improve visitor and security workflows in a future-ready manner.
8.  Provide reports and dashboards for society operations and financial
    visibility.
9.  Protect personal, financial, and society data through role-based
    access and audit logging.

## 3. Scope

### 3.1 In scope for the initial release

-   Authentication, password reset, and role-based authorization
-   Society, building/wing, unit, and member management
-   Member profile and household information
-   Notices and announcements
-   Maintenance charges, invoices, payment status, and receipts
-   Complaints and service requests
-   Amenity listing and booking requests
-   Document repository
-   Admin dashboard and operational reports
-   Notifications within the application and by email; SMS/push can be
    added through integrations
-   Audit trail for important administrative actions

### 3.2 Potential future scope

-   Visitor pre-approval, gate entry, and delivery logging
-   Security guard mobile interface
-   Accounting ledger and bank reconciliation
-   Vendor and staff management
-   Polls, elections, and committee voting
-   Online meeting scheduling and minutes
-   Parking allocation and vehicle records
-   Utility meter readings and consumption billing
-   Native Android/iOS applications
-   Multiple societies managed by one platform operator

## 4. User Roles and Permissions

  Capability                                        Society Member                Society Admin
  ---------------------------------------------- ----------------- ----------------------------
  View own profile and unit details                            Yes                          Yes
  Edit own permitted profile fields                            Yes                          Yes
  View society notices                                         Yes                          Yes
  Publish, edit, or archive notices                             No                          Yes
  View own invoices and payment history                        Yes                          Yes
  Create maintenance bills and record payments                  No                          Yes
  Download own receipts                                        Yes                          Yes
  Raise complaints/service requests                            Yes   Yes, on behalf of a member
  View own request status and comments                         Yes                          Yes
  Assign, update, and close requests                            No                          Yes
  View amenity availability                                    Yes                          Yes
  Submit amenity booking requests                              Yes                          Yes
  Approve/reject amenity bookings                               No                          Yes
  View society documents                           Based on access                          Yes
  Upload/manage shared documents                                No                          Yes
  View administrative reports                                   No                          Yes
  Manage users, units, and society settings                     No                          Yes
  View audit logs                                               No        Authorized admin only

**Authorization rule:** Members must only access records belonging to
their own account, household, or unit as explicitly permitted. Admin
access should be limited to the society or societies assigned to that
admin.

## 5. Functional Requirements

### 5.1 Authentication and Account Management

-   **FR-AUTH-001:** The system shall allow users to sign in using a
    registered email address or mobile number and password.
-   **FR-AUTH-002:** The system shall provide a secure password-reset
    flow using a time-limited verification link or OTP.
-   **FR-AUTH-003:** The system shall enforce role-based access control
    for Member and Admin roles.
-   **FR-AUTH-004:** The system shall allow an admin to invite or
    register members and associate them with a society and unit.
-   **FR-AUTH-005:** The system shall support account activation,
    suspension, and deactivation by an authorized admin.
-   **FR-AUTH-006:** The system shall record login time and relevant
    security events.
-   **FR-AUTH-007:** The system shall provide logout and
    session-expiration functionality.

### 5.2 Society, Building, and Unit Management

-   **FR-SOC-001:** Admins shall be able to create and update society
    details, including name, address, contact information, and
    configured rules.
-   **FR-SOC-002:** Admins shall be able to define buildings/wings and
    units within a society.
-   **FR-SOC-003:** Each unit shall have a unique identifier within its
    society.
-   **FR-SOC-004:** Admins shall be able to associate one or more owners
    and occupants/tenants with a unit, subject to configured rules.
-   **FR-SOC-005:** The system shall maintain occupancy status and
    membership history.
-   **FR-SOC-006:** Members shall be able to view their linked unit and
    household details.
-   **FR-SOC-007:** The system shall prevent duplicate active unit
    assignments where the society's configured rules prohibit them.

### 5.3 Member Profile

-   **FR-MEM-001:** Members shall be able to view their profile, contact
    details, and linked unit.
-   **FR-MEM-002:** Members shall be able to request changes to
    protected information where admin approval is required.
-   **FR-MEM-003:** Admins shall be able to review and approve or reject
    profile-change requests.
-   **FR-MEM-004:** The system shall support household/occupant contact
    records with configurable visibility.

### 5.4 Notices and Announcements

-   **FR-NOT-001:** Admins shall be able to create, edit, publish,
    schedule, and archive notices.
-   **FR-NOT-002:** Notices shall support a title, message, category,
    publish date, expiry date, and optional attachments.
-   **FR-NOT-003:** Members shall be able to view current and past
    notices available to them.
-   **FR-NOT-004:** The system should record notice readership where
    feasible.
-   **FR-NOT-005:** The system should notify members when important
    notices are published.

### 5.5 Maintenance Billing and Payments

-   **FR-BILL-001:** Admins shall be able to configure charge types,
    billing periods, due dates, and late-fee rules.
-   **FR-BILL-002:** Admins shall be able to generate invoices for
    individual units or a selected group of units.
-   **FR-BILL-003:** Members shall be able to view their invoices, line
    items, due dates, payment status, and outstanding balance.
-   **FR-BILL-004:** The system shall support payment statuses such as
    Draft, Issued, Partially Paid, Paid, Overdue, and Cancelled.
-   **FR-BILL-005:** The system shall maintain a transaction history for
    each invoice.
-   **FR-BILL-006:** The system should integrate with a payment gateway
    for online payments.
-   **FR-BILL-007:** The system shall generate a receipt after a payment
    is confirmed.
-   **FR-BILL-008:** Admins shall be able to record offline payments
    with payment date, method, reference number, and remarks.
-   **FR-BILL-009:** The system shall support downloadable invoice and
    receipt documents.
-   **FR-BILL-010:** Payment gateway callbacks/webhooks shall be
    verified before an invoice is marked paid.
-   **FR-BILL-011:** The system shall not store raw card numbers, CVV
    values, or other sensitive payment credentials.

### 5.6 Complaints and Service Requests

-   **FR-REQ-001:** Members shall be able to submit a complaint or
    service request with category, subject, description, priority, and
    optional attachments.
-   **FR-REQ-002:** The system shall generate a unique request/ticket
    number.
-   **FR-REQ-003:** Members shall be able to view the status and history
    of their own requests.
-   **FR-REQ-004:** Admins shall be able to assign requests to a
    responsible person or team.
-   **FR-REQ-005:** Admins shall be able to update status, add internal
    notes, and communicate responses to the member.
-   **FR-REQ-006:** The system shall support configurable statuses such
    as Open, Acknowledged, In Progress, Waiting for Member, Resolved,
    and Closed.
-   **FR-REQ-007:** The system should notify the member when the request
    status changes.
-   **FR-REQ-008:** The system should allow a member to rate the
    resolution after closure.

### 5.7 Amenities and Facility Booking

-   **FR-AMN-001:** Admins shall be able to configure amenities such as
    a clubhouse, gym, sports court, or community hall.
-   **FR-AMN-002:** Each amenity shall have availability windows,
    capacity, booking rules, fees (if applicable), and maintenance
    blackout periods.
-   **FR-AMN-003:** Members shall be able to view availability and
    submit booking requests.
-   **FR-AMN-004:** The system shall prevent conflicting confirmed
    bookings for the same amenity and time slot.
-   **FR-AMN-005:** Admins shall be able to approve, reject, cancel, or
    mark bookings as completed.
-   **FR-AMN-006:** Members shall be able to view their booking history
    and status.

### 5.8 Documents

-   **FR-DOC-001:** Admins shall be able to upload and categorize
    society documents.
-   **FR-DOC-002:** Members shall be able to view or download documents
    permitted for their role.
-   **FR-DOC-003:** The system shall store document metadata, uploader,
    upload time, category, and access level.
-   **FR-DOC-004:** The system shall validate file type and size and
    scan uploaded files where infrastructure supports it.

### 5.9 Notifications

-   **FR-NTF-001:** The system shall provide an in-app notification
    center.
-   **FR-NTF-002:** Notifications shall support events such as new
    notices, invoice generation, payment confirmation, request updates,
    and booking decisions.
-   **FR-NTF-003:** Users should be able to mark notifications as read.
-   **FR-NTF-004:** Email, SMS, and push notifications shall be
    configurable integrations rather than hard-coded dependencies.
-   **FR-NTF-005:** The system should allow users to configure
    non-critical notification preferences.

### 5.10 Dashboards and Reports

**Member dashboard should show:** - Outstanding balance and next payment
due date - Recent invoices and payment history - Latest notices and
announcements - Open complaints/service requests - Upcoming amenity
bookings - Recent notifications

**Admin dashboard should show:** - Total units, occupied units, and
active members - Total billed, collected, outstanding, and overdue
amounts - Recent payments and unpaid invoices - Open requests grouped by
status and priority - Upcoming amenity bookings - Recent administrative
activity

**Reports:** - Member/unit directory - Invoice and collection report by
period - Outstanding dues and aging report - Payment transaction
report - Complaint/request status and resolution report - Amenity
booking report

Reports should support date filters and CSV export. PDF export may be
added for invoices, receipts, and selected reports.

## 6. Non-Functional Requirements

### 6.1 Security and Privacy

-   **NFR-SEC-001:** All production traffic shall use HTTPS.
-   **NFR-SEC-002:** Passwords shall be stored using a modern, salted
    password-hashing algorithm.
-   **NFR-SEC-003:** APIs shall enforce authentication and authorization
    on the server; hiding frontend controls is not sufficient.
-   **NFR-SEC-004:** Sensitive configuration and secrets shall be stored
    outside source control.
-   **NFR-SEC-005:** The system shall validate and sanitize input and
    protect against common web vulnerabilities, including injection,
    cross-site scripting, and cross-site request forgery where
    applicable.
-   **NFR-SEC-006:** Administrative and financial actions shall be audit
    logged.
-   **NFR-SEC-007:** Uploaded files shall be subject to type/size
    validation and access controls.
-   **NFR-SEC-008:** Personal data shall only be visible to authorized
    users and used for defined society-management purposes.
-   **NFR-SEC-009:** Rate limiting and account lockout or equivalent
    abuse protections shall be applied to authentication endpoints.

### 6.2 Performance and Scalability

-   **NFR-PER-001:** Common dashboard and listing operations should
    return within 2 seconds under the agreed normal operating load,
    excluding external payment/email provider delays.
-   **NFR-PER-002:** List endpoints shall support pagination, filtering,
    and sorting.
-   **NFR-PER-003:** Database queries shall be indexed and reviewed for
    high-volume records.
-   **NFR-PER-004:** The architecture shall support scaling the API and
    background workers independently.
-   **NFR-PER-005:** File uploads and report generation should not block
    normal API request processing.

### 6.3 Availability and Recovery

-   **NFR-AVL-001:** Production hosting should target 99.5% monthly
    availability initially, subject to hosting and operational
    agreements.
-   **NFR-AVL-002:** Automated database backups shall be configured and
    periodically restore-tested.
-   **NFR-AVL-003:** The system shall log errors and operational events
    for troubleshooting.
-   **NFR-AVL-004:** Recovery time and recovery point objectives shall
    be agreed before production launch.

### 6.4 Usability and Accessibility

-   **NFR-UX-001:** The user interface shall be responsive for desktop,
    tablet, and mobile browsers.
-   **NFR-UX-002:** Navigation and terminology shall be consistent
    across member and admin experiences.
-   **NFR-UX-003:** Forms shall provide clear validation messages and
    accessible labels.
-   **NFR-UX-004:** The UI should follow WCAG 2.1 AA accessibility
    guidance where practical.
-   **NFR-UX-005:** Dates, currency, time zone, and address formats
    shall be configurable for the society's locale.

### 6.5 Maintainability and Observability

-   **NFR-MNT-001:** Frontend and backend code shall be organized into
    feature-based modules/apps.
-   **NFR-MNT-002:** APIs shall be documented using OpenAPI.
-   **NFR-MNT-003:** Automated unit and integration tests shall cover
    critical business workflows.
-   **NFR-MNT-004:** Separate development, staging, and production
    configurations shall be maintained.
-   **NFR-MNT-005:** Application logs shall avoid exposing passwords,
    payment credentials, or unnecessary personal data.

## 7. Proposed Technology Architecture

### 7.1 Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                Angular                 Member and admin web
                                                  applications, routing,
                                                  forms, dashboards,
                                                  responsive UI

  API framework           Python FastAPI          Typed REST APIs,
                                                  request validation,
                                                  OpenAPI documentation,
                                                  async endpoints and
                                                  integrations

  Core backend/admin      Django                  Core domain models,
                                                  Django ORM, Django
                                                  Admin, selected
                                                  authentication and
                                                  management workflows

  Database                PostgreSQL              Persistent relational
                          (recommended)           data

  Cache / background jobs Redis + Celery          Background
                          (optional, recommended  notifications,
                          as workload grows)      scheduled billing,
                                                  report generation

  File storage            S3-compatible object    Society documents,
                          storage or equivalent   invoice PDFs, complaint
                                                  attachments

  Deployment              Docker                  Reproducible services
                                                  and deployment

  Reverse proxy           Nginx or managed        TLS termination and
                          gateway                 routing

  Testing                 Angular testing tools,  Automated frontend and
                          Pytest, Django test     backend tests
                          framework               

  API documentation       OpenAPI / Swagger UI    API discovery and
                                                  integration
  -----------------------------------------------------------------------

### 7.2 Important Backend Design Decision

FastAPI and Django overlap in their ability to expose APIs and implement
business logic. To avoid duplicated models, authentication rules, and
business logic, the project must define a clear ownership boundary.

**Recommended initial approach:** - Django owns the canonical data
models, database migrations, Django Admin, and core domain rules. -
FastAPI provides the public API layer for Angular and delegates domain
operations to shared Python service modules or a clearly defined
internal Django-backed service layer. - Both frameworks must use the
same documented domain services and authorization policies; business
rules must not be independently reimplemented in two places. - Avoid
having Django and FastAPI independently modify the same tables through
separate model definitions. - If the project does not require Django
Admin or Django-specific capabilities, consider using FastAPI alone to
reduce operational complexity.

An alternative is to use Django REST Framework for all APIs and omit
FastAPI. The final choice should be made before implementation.

### 7.3 Logical Architecture

``` text
+------------------------------------------------------+
|                    Angular Web App                   |
|       Member Portal       |       Admin Portal       |
+---------------------------+--------------------------+
                            |
                         HTTPS
                            |
+------------------------------------------------------+
|              API Gateway / Nginx (optional)          |
+------------------------------------------------------+
             |                         |
             v                         v
+--------------------------+  +-------------------------+
|       FastAPI API        |  | Django Admin / Core     |
| REST endpoints, schema   |  | ORM, migrations, admin  |
| validation, integrations |  | domain services         |
+--------------------------+  +-------------------------+
             |                         |
             +------------+------------+
                          |
                          v
+------------------------------------------------------+
|                    PostgreSQL                        |
+------------------------------------------------------+
        |                    |                  |
        v                    v                  v
+---------------+   +----------------+   +----------------+
| Redis/Celery  |   | Object Storage |   | External       |
| Background   |   | Documents/PDFs |   | Payment/Email  |
| Jobs          |   |                |   | Providers      |
+---------------+   +----------------+   +----------------+
```

This is a logical view, not a requirement to deploy every box as a
separate service in the first release.

## 8. High-Level Data Model

The following entities are proposed. Detailed attributes, constraints,
and relationships will be finalized during database design.

  Entity             Purpose
  ------------------ ----------------------------------------------------
  Society            Society profile, address, settings
  Building           Building or wing within a society
  Unit               Flat, apartment, or other premises
  User               Login identity and account status
  Membership         Relationship between user, society, unit, and role
  HouseholdMember    Additional occupants or family contacts
  Notice             Society announcement
  NoticeAttachment   Files associated with a notice
  ChargeType         Maintenance or other charge configuration
  Invoice            Bill issued to a unit/member
  InvoiceLineItem    Individual charge lines
  Payment            Payment transaction or offline payment record
  Receipt            Proof of confirmed payment
  Complaint          Member issue or service request
  ComplaintComment   Public response or internal note
  Amenity            Bookable shared facility
  AmenitySlot        Availability or booking time window
  Booking            Member's amenity booking request
  Document           Shared society document and access metadata
  Notification       In-app notification
  AuditLog           Record of important user/admin actions

**Data ownership:** Every society-owned record should carry a society
reference directly or through a well-defined parent relationship.
Queries must enforce society-level isolation.

## 9. API Requirements

-   REST-style JSON APIs shall be used between Angular and backend
    services.
-   APIs shall use a versioned base path, for example `/api/v1/`.
-   OpenAPI documentation shall be generated and maintained.
-   Authentication shall use secure, short-lived access credentials and
    a defined refresh/session strategy.
-   API errors shall use a consistent response structure and appropriate
    HTTP status codes.
-   List endpoints shall support pagination and common filters.
-   File uploads shall use dedicated endpoints with server-side
    validation.
-   Webhook endpoints shall verify provider signatures and be
    idempotent.

### 9.1 Indicative API Groups

  ------------------------------------------------------------------------------
  API group                           Example endpoints
  ----------------------------------- ------------------------------------------
  Authentication                      `POST /api/v1/auth/login`,
                                      `POST /api/v1/auth/refresh`,
                                      `POST /api/v1/auth/password-reset`

  Members                             `GET /api/v1/members/me`,
                                      `PATCH /api/v1/members/me`

  Society / Units                     `GET /api/v1/society`,
                                      `GET /api/v1/units`, `POST /api/v1/units`

  Notices                             `GET /api/v1/notices`,
                                      `POST /api/v1/notices`,
                                      `PATCH /api/v1/notices/{id}`

  Invoices                            `GET /api/v1/invoices`,
                                      `GET /api/v1/invoices/{id}`,
                                      `POST /api/v1/invoices`

  Payments                            `POST /api/v1/payments/checkout`,
                                      `GET /api/v1/payments/history`,
                                      `POST /api/v1/payments/webhook`

  Complaints                          `GET /api/v1/complaints`,
                                      `POST /api/v1/complaints`,
                                      `PATCH /api/v1/complaints/{id}`

  Amenities                           `GET /api/v1/amenities`,
                                      `GET /api/v1/amenities/availability`,
                                      `POST /api/v1/bookings`

  Documents                           `GET /api/v1/documents`,
                                      `POST /api/v1/documents`

  Notifications                       `GET /api/v1/notifications`,
                                      `PATCH /api/v1/notifications/{id}/read`

  Reports                             `GET /api/v1/admin/reports/collections`,
                                      `GET /api/v1/admin/reports/complaints`
  ------------------------------------------------------------------------------

These endpoints are illustrative and must be refined with
request/response schemas and authorization rules.

## 10. Key Business Rules

1.  A user may have different roles in different societies; role
    assignment must be scoped to a society.
2.  A member must not access another member's invoices, payments,
    complaints, or private profile information.
3.  An invoice must have a unique invoice number within the agreed
    numbering scope.
4.  A confirmed payment must not be applied twice, even if a payment
    webhook is delivered more than once.
5.  An invoice should only be marked Paid when confirmed payments cover
    the payable amount, subject to the configured adjustment rules.
6.  Financial records should not be physically deleted through normal
    admin workflows; corrections should use reversal, cancellation, or
    adjustment records with audit history.
7.  Amenity bookings must respect capacity, availability, blackout
    periods, and overlapping-booking rules.
8.  Admin actions affecting members or finances must be auditable.
9.  Society-specific data must be isolated from other societies.
10. Retention, privacy, and financial-record policies must be
    configurable to meet applicable legal requirements.

## 11. Acceptance Criteria for Initial Release

The initial release will be considered ready for user acceptance testing
when:

-   Members and admins can sign in and see only the features and records
    permitted by their roles.
-   An admin can create a society structure, units, and member
    associations.
-   A member can view their profile, notices, invoices, payment history,
    and requests.
-   An admin can publish a notice and members can see it.
-   An admin can generate an invoice and a member can view it.
-   A payment can be recorded or confirmed through the selected payment
    workflow and a receipt can be produced.
-   A member can submit a complaint and an admin can assign, update, and
    resolve it.
-   A member can request an amenity booking and an admin can approve or
    reject it.
-   Admin dashboards and key reports show consistent data.
-   Authorization tests demonstrate that one member cannot retrieve
    another member's private records.
-   Critical workflows have automated tests and deployment instructions.
-   Backups, monitoring, and production security configuration are in
    place.

## 12. Suggested Delivery Phases

### Phase 1 --- Foundation

-   Confirm business rules and society operating model
-   Set up Angular, Django, FastAPI, database, environments, and CI/CD
-   Implement authentication, roles, society, buildings, units, and
    member management

### Phase 2 --- Communication and Service

-   Member/admin dashboards
-   Notices and notifications
-   Complaints and service requests
-   Document repository

### Phase 3 --- Finance

-   Charge configuration and invoice generation
-   Payment gateway integration or offline payment recording
-   Receipts, payment history, and collection reports

### Phase 4 --- Facilities and Launch

-   Amenities and booking workflow
-   Security review, performance testing, backup/restore test
-   User acceptance testing, training, and production launch

## 13. Assumptions and Open Questions

The following decisions are required before detailed design and
estimation:

1.  Is the platform for one society only, or will it support multiple
    societies (multi-tenant SaaS)?
2.  Will a unit support multiple owners, tenants, and family members?
3.  Which country, currency, tax rules, and billing practices must be
    supported?
4.  Which payment gateway is preferred? Are offline payments also
    required?
5.  Should admins be able to create recurring monthly/quarterly
    maintenance bills?
6.  Are late fees, interest, discounts, waivers, and partial payments
    required?
7.  Is visitor management required in the first release?
8.  Should members use email, mobile number, or either for login?
9.  Which notification channels are required at launch: in-app, email,
    SMS, or push?
10. Is a mobile app required, or is a responsive Angular web application
    sufficient initially?
11. Which file types and maximum upload sizes should be allowed?
12. What are the expected number of societies, units, users, and
    concurrent users?
13. What are the required data-retention, privacy, audit, and backup
    policies?
14. What is the intended responsibility split between Django and
    FastAPI?

## 14. Out of Scope Unless Confirmed

The following are not assumed to be part of the initial release: legal
accounting compliance, bank account aggregation, automated bank
reconciliation, biometric access control, hardware gate integrations,
native mobile apps, and integrations with third-party
property-management systems.

------------------------------------------------------------------------

**End of document**
