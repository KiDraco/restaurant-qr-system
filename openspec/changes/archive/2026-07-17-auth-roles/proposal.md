# Proposal: Auth Roles

## Why

Admin panel at `/admin` is completely open — anyone who navigates there gets full control. No distinction between owner and staff access, no audit trail, no access control.

## What Changes

- New `users` table: `id, name, email, password_hash, role (admin|staff), created_at`
- Auth API: `POST /api/auth/login`, `POST /api/auth/register` (setup), `GET /api/auth/me`
- JWT middleware protecting backend admin routes
- Login page at `/admin/login`; unauthenticated → redirect
- Client QR → table session flow stays untouched

## Capabilities

### New Capabilities
- `user-auth`: Auth system with JWT, bcrypt, role-based access (admin/staff), login/register/me

### Modified Capabilities
None.

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/models/User.js` | New | User model — findByEmail, create, verifyPassword |
| `backend/src/controllers/authController.js` | New | login, register, me handlers |
| `backend/src/routes/authRoutes.js` | New | POST /login, POST /register, GET /me |
| `backend/src/middleware/auth.js` | New | JWT verify + requireRole factory |
| `backend/src/app.js` | Modified | Mount `/api/auth`, protect admin endpoints |
| `backend/src/config/database.js` | Modified | Add `users` table to schema |
| `frontend/src/pages/admin/Login.jsx` | New | Email + password login form |
| `frontend/src/components/admin/AuthGuard.jsx` | New | Route wrapper checking JWT in localStorage |
| `frontend/src/AdminApp.jsx` | Modified | Wrap with AuthGuard, redirect |
| `frontend/src/index.jsx` | Modified | Add `/admin/login` route |
| `package.json` (backend) | Modified | Add `bcryptjs`, `jsonwebtoken` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| localStorage token — XSS vulnerable | Med | Follow up with httpOnly cookies; document tradeoff |
| Admin routes break from auth middleware | Low | Test each endpoint after adding |
| First /register call is unauthenticated | Med | Guard with env-var secret or setup-only JWT |

## Rollback Plan

1. Delete `User.js`, `authController.js`, `authRoutes.js`, `auth.js`
2. Revert `app.js` — remove auth routes and middleware
3. Revert `database.js` — remove users table
4. Delete `Login.jsx`, `AuthGuard.jsx`
5. Revert `AdminApp.jsx`, `index.jsx`
6. Remove `bcryptjs`, `jsonwebtoken` — `npm install`

## Success Criteria

- [ ] `POST /api/auth/login` returns JWT for valid creds, 401 for invalid
- [ ] `GET /api/auth/me` returns profile with token, 401 without
- [ ] Unauthenticated admin API requests return 401
- [ ] `/admin` without token redirects to `/admin/login`
- [ ] Login redirects to admin dashboard
- [ ] Client QR → table session works without auth
