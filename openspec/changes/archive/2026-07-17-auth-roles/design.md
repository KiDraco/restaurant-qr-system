# Design: Auth Roles

## Context

The admin panel at `/admin` currently has zero access control — anyone who navigates there gets full control. The client QR → table session flow (no auth, automatic) stays untouched. This change adds JWT-based auth with role support (admin, staff) for the admin side only.

**Stack**: Node.js + Express (CommonJS) + SQLite3 backend, React 18 + Tailwind 3 + React Router 6 frontend.

## Goals / Non-Goals

**Goals:**
- Users table with `id, name, email, password_hash, role, created_at`
- Auth API: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- JWT verification middleware + `requireRole(role)` factory for route protection
- Admin login page at `/admin/login` with email + password form
- `AuthGuard` component wrapping `/admin/*` routes, redirecting unauthenticated users
- Client QR → table session flow remains untouched (no auth required)

**Non-Goals:**
- Password reset / "forgot password" flow
- Refresh token rotation (deferred)
- OAuth / social login
- Token storage migration to httpOnly cookies (documented tradeoff)
- Audit logging of admin actions

## Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Token storage | httpOnly cookie vs localStorage | localStorage | Simpler for SPA; XSS risk accepted and documented |
| Password hashing | bcrypt, argon2, bcryptjs | bcryptjs | Zero native deps, pure JS, matches Node 14+ compatibility |
| First-registration guard | Env secret vs setup token | Env var `ADMIN_SETUP_SECRET` | Simple check: `/register` requires matching header, disabled after first user |
| JWT expiry | None vs 24h vs 7d | 24h | Balances security with UX for a single-shift restaurant tool |
| Role granularity | admin+staff+viewer vs admin+staff | admin, staff | Current needs; extendable via the same `requireRole` factory |
| Frontend route strategy | Lazy routes vs direct imports | Direct imports | Keeps existing pattern used in `AdminApp.jsx` — no code-splitting overhead |

## Data Flow

```
── Login ───────────────────────────────────────────────────────

  Login.jsx         POST /api/auth/login           authController.login
     │                     │                              │
     │   {email,password}  │    bcrypt.compare             │
     ├────────────────────►│  ───────►  verify hash        │
     │                     │              │                │
     │   {token,user}      │         sign JWT              │
     │◄────────────────────│  ◄───────  with {id,role}     │
     │                     │                              │
  localStorage.setItem     │                              │
  ('token', token)         │                              │
     │                     │                              │
  Redirect /admin          │                              │

── Protected Request (Backend) ──────────────────────────────────

  req ──► auth middleware ──► requireRole('admin') ──► controller
            │                       │
        verify token            check decoded.role
        attach req.user         reject if wrong role
        401 if invalid          (403 if role mismatch)

── Protected Route (Frontend) ───────────────────────────────────

  Browser ──► /admin ──► AuthGuard ──► AdminApp
                           │
                      check localStorage
                      no token? redirect /admin/login
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/models/User.js` | Create | findByEmail, create, verifyPassword using bcryptjs |
| `backend/src/controllers/authController.js` | Create | login, register (guarded), me handlers |
| `backend/src/routes/authRoutes.js` | Create | POST /login, POST /register, GET /me |
| `backend/src/middleware/auth.js` | Create | JWT verify middleware + requireRole(role) factory |
| `backend/src/app.js` | Modify | Mount `/api/auth`, protect admin-facing routes with auth middleware |
| `backend/src/config/database.js` | Modify | Add `users` table to schema |
| `backend/package.json` | Modify | Add bcryptjs, jsonwebtoken deps |
| `backend/.env` | Modify | Add JWT_SECRET, ADMIN_SETUP_SECRET |
| `frontend/src/services/api.js` | Modify | Add auth methods (login, register, getMe, auth headers) |
| `frontend/src/pages/admin/Login.jsx` | Create | Email + password form, POST to /api/auth/login |
| `frontend/src/components/admin/AuthGuard.jsx` | Create | Reads token from localStorage, redirects if missing |
| `frontend/src/AdminApp.jsx` | Modify | Wrap export with AuthGuard |
| `frontend/src/index.jsx` | Modify | Add `/admin/login` route before `/admin` |

## Interfaces / Contracts

```
POST /api/auth/login
  Request:  { email: string, password: string }
  Success:  { token: string, user: { id, name, email, role } }
  Errors:   400 (missing fields), 401 (invalid creds)

POST /api/auth/register
  Headers:  x-admin-secret: <ADMIN_SETUP_SECRET>
  Request:  { name: string, email: string, password: string, role?: 'admin'|'staff' }
  Success:  { token: string, user: { id, name, email, role } }
  Errors:   400 (missing/weak fields), 403 (bad secret), 409 (email exists)

GET /api/auth/me
  Headers:  Authorization: Bearer <token>
  Success:  { user: { id, name, email, role } }
  Errors:   401 (missing/invalid token)

JWT payload: { id, role, iat, exp }
JWT expiry:  24h
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Backend unit | User model — findByEmail, create, verifyPassword | Manual / curl — no test infrastructure in backend yet |
| Backend integration | Auth endpoints — login, register, me with real SQLite | Manual via API |
| Backend security | Wrong password → 401, missing token → 401, wrong role → 403 | Manual verification |
| Frontend unit | AuthGuard renders children vs redirects based on token | Jest + RTL (existing CRA setup) |
| Frontend unit | Login form submit calls API, saves token, redirects | Jest + RTL |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Standard JWT auth middleware does not introduce these categories.

## Migration / Rollout

No migration required. The `users` table is created via `CREATE TABLE IF NOT EXISTS` in `database.js`. First user registers via the setup-secret guarded endpoint. Existing admin routes remain accessible (now behind auth) once a user is created and logged in.

Rollback steps: covered in `proposal.md`.

## Open Questions

- [ ] What admin API routes need protection? All of `/api/tables`, `/api/requests`, `/api/menu`, `/api/orders` — or should some remain public (e.g., menu read)?
- [ ] Should `/admin/*` sub-routes enforce specific roles or just require any authenticated user?
- [ ] Password minimum length / complexity rules for registration validation?
