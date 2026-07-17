# user-auth Specification

## ADDED Requirements

### Requirement: User Registration
The system SHALL support user registration with name, email, password (min 8 chars), and role (admin|staff). The first registration SHALL use a setup secret; subsequent registrations SHALL require an existing admin.

#### Scenario: First registration with setup secret
- GIVEN no users exist
- WHEN POST /api/auth/register includes a valid setup secret
- THEN a 201 response returns the user profile

#### Scenario: Subsequent registration requires admin
- GIVEN an admin user exists
- WHEN a non-admin POSTs to /api/auth/register
- THEN 403 Forbidden is returned

### Requirement: User Login
The system SHALL authenticate via POST /api/auth/login with email+password and return a JWT containing id, name, email, and role.

#### Scenario: Valid credentials return JWT
- GIVEN a registered user
- WHEN POST /api/auth/login with correct credentials
- THEN a 200 response returns `{ token, user: { id, name, email, role } }`

#### Scenario: Invalid credentials return 401
- GIVEN a registered user
- WHEN POST /api/auth/login with wrong password
- THEN 401 is returned

### Requirement: Token Verification
The system SHALL verify JWT via GET /api/auth/me and return the authenticated user's profile.

#### Scenario: Valid token returns profile
- GIVEN a valid JWT
- WHEN GET /api/auth/me with Authorization: Bearer \<token\>
- THEN 200 returns user profile

#### Scenario: Invalid token returns 401
- GIVEN an expired or malformed JWT
- WHEN GET /api/auth/me
- THEN 401 is returned

### Requirement: Role-Based Access
The system SHALL enforce role-based access: admin has full access; staff is restricted to read-menu and view-requests; unauthenticated requests receive 401.

#### Scenario: Admin accesses user management
- GIVEN an admin user
- WHEN requesting a user-management endpoint
- THEN the request succeeds

#### Scenario: Staff denied admin action
- GIVEN a staff user
- WHEN requesting a menu-editing endpoint
- THEN 403 is returned

#### Scenario: Unauthenticated admin route
- GIVEN no JWT
- WHEN requesting any admin endpoint
- THEN 401 is returned

### Requirement: Admin Login UI
The system SHALL provide a login form at /admin/login. On success, the JWT is stored in localStorage and the user redirected to /admin. On failure, an error is displayed.

#### Scenario: Login success redirects
- GIVEN a user at /admin/login
- WHEN submitting valid credentials
- THEN JWT is saved to localStorage and the user is redirected to /admin

#### Scenario: Login failure shows error
- GIVEN a user at /admin/login
- WHEN submitting invalid credentials
- THEN an error message is displayed and the user stays on /admin/login

### Requirement: Route Protection
The system SHALL protect admin routes with an AuthGuard component. No token redirects to /admin/login. Expired token redirects to /admin/login.

#### Scenario: No token redirects
- GIVEN an unauthenticated user
- WHEN navigating to /admin
- THEN AuthGuard redirects to /admin/login

#### Scenario: Expired token redirects
- GIVEN a user with an expired JWT in localStorage
- WHEN AuthGuard validates the token
- THEN the user is redirected to /admin/login

### Requirement: Client Flow Preservation
Guest-facing endpoints (menu, orders, table session) SHALL NOT require authentication.

#### Scenario: QR scan without auth
- GIVEN a customer scanning a QR code
- WHEN accessing the menu without any auth header
- THEN the menu loads and the table session works normally
