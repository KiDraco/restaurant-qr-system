# Tasks: Auth Roles

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Foundation

- [x] 1.1 Add `bcryptjs` and `jsonwebtoken` to `backend/package.json`
- [x] 1.2 Add `JWT_SECRET` and `ADMIN_SETUP_SECRET` to `backend/.env`
- [x] 1.3 Add `users` table (`id, name, email, password_hash, role, created_at`) to `backend/src/config/database.js`

## Phase 2: Backend Auth

- [x] 2.1 Create `backend/src/models/User.js` with `findByEmail`, `create`, `verifyPassword` using bcryptjs
- [x] 2.2 Create `backend/src/middleware/auth.js` with `verifyToken` (JWT) and `requireRole(role)` factory
- [x] 2.3 Create `backend/src/controllers/authController.js` with `login`, `register` (setup-secret guarded), `me`
- [x] 2.4 Create `backend/src/routes/authRoutes.js`: `POST /login`, `POST /register`, `GET /me`
- [x] 2.5 Mount `/api/auth` routes in `backend/src/app.js`
- [x] 2.6 Apply `verifyToken` middleware to admin API routes; keep client endpoints public

## Phase 3: Frontend Auth

- [x] 3.1 Add `login`, `register`, `getMe`, and auth header helpers to `frontend/src/services/api.js`
- [x] 3.2 Create `frontend/src/pages/admin/Login.jsx` — email+password form, stores JWT, redirects on success
- [x] 3.3 Create `frontend/src/components/admin/AuthGuard.jsx` — checks localStorage token, redirects to `/admin/login`
- [x] 3.4 Wrap `AdminApp` export with `AuthGuard` in `frontend/src/AdminApp.jsx`
- [x] 3.5 Add `/admin/login` route before `/admin` in `frontend/src/index.jsx`

## Phase 4: Verification

- [ ] 4.1 Verify: `POST /api/auth/login` — valid creds → 200 + JWT; wrong password → 401
- [ ] 4.2 Verify: `POST /api/auth/register` — valid secret → 201; bad secret → 403; duplicate email → 409
- [ ] 4.3 Verify: `GET /api/auth/me` — valid token → profile; no/expired token → 401
- [ ] 4.4 Verify: Admin routes return 401 without token; staff route returns 403 for admin-only action
- [ ] 4.5 Verify: Login form saves token to localStorage and redirects; invalid creds shows error
- [ ] 4.6 Verify: AuthGuard redirects unauthenticated users to `/admin/login`
- [ ] 4.7 Verify: Client QR → table session works without any auth header
