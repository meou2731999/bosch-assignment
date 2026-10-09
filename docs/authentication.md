# Backend authentication (step 1)

The API now requires server-issued sessions. `x-demo-user` is ignored. The frontend restores the server session, supports login/logout and required or voluntary password changes, and gives admins a user-management screen. Session and CSRF tokens are not stored in localStorage.

## First administrator

Run `npm run bootstrap:admin` with `ADMIN_EMAIL` and `ADMIN_PASSWORD` supplied through the environment. Use a password of at least 12 characters and at most 256 UTF-8 bytes. The command refuses to bootstrap when an active admin already exists. There is no default password. `DATA_DIR` selects the same data directory for bootstrap and the API; otherwise both use `.data`.

Passwords are salted with 16 random bytes and hashed using asynchronous Node scrypt. Stored account records are written atomically with file mode 0600. API account responses omit hashes and credential versions.

Legacy Alex/Sam/Morgan IDs are preserved for existing request ownership. These accounts start disabled without passwords; their email identifiers are alex@example.test, sam@example.test and morgan@example.test. An admin must reset their passwords and enable them. Account emails for newly created users are normalized to lowercase and unique.

## API contract

- `POST /api/auth/login`: JSON `{email,password}` and `X-Requested-With: RequestDesk`; returns `{user,csrfToken}` and a session cookie.
- `GET /api/auth/session`: returns the current public account and CSRF token.
- `POST /api/auth/logout`: clears the current session.
- `POST /api/auth/change-password`: `{currentPassword,password}`; requires a different new password, clears the forced-change flag and revokes all sessions. Sign in again afterward.
- `GET /api/admin/users`: public account list, admin only.
- `POST /api/admin/users`: `{email,password,name,department,role,isAdmin?}`; role is requester or reviewer, isAdmin defaults to false. New users must change their password.
- `POST /api/admin/users/:id/reset-password`: `{password}`; revokes all target sessions and requires a password change.
- `PATCH /api/admin/users/:id`: `{name?,email?,department?,role?,isAdmin?,active?}` with at least one property; revokes target sessions after edits. Enabling an account without a password and disabling the last active admin are rejected.

Authenticated mutations require `X-CSRF-Token` from login/session. Accounts with a required password change can only use session, logout and change-password endpoints. Administrative access is separate from the requester/reviewer role; form-specific permissions are step 3.

The cookie is HttpOnly, SameSite=Strict, scoped to `/api`, with an absolute eight-hour lifetime. Set `SECURE_COOKIES=true` when serving through HTTPS. Sessions are in memory and invalidated on API restart; user credentials persist in users.json. No CORS permission is enabled. Login requires JSON and a custom header, and limits attempts per email (10) and IP (50) per 15-minute window. Successful login clears the email counter; the IP window remains. Rate limits are process-local.

## Verification

`npm run check` runs Vitest unit/API tests and the TypeScript/Vite build. Tests create isolated temporary data directories. Authentication tests cover password hashing and bounds, duplicate/bootstrap races, persistence, session expiry/revocation, CSRF, impersonation rejection, forced changes, reset/disable/enable, admin boundaries, logout, restart and login throttling. Existing attachment API tests authenticate through login.

## Browser verification (step 2)

Install the Chromium test browser with `npx playwright install chromium`, then run `npm run test:e2e`. Playwright builds the actual frontend and starts an isolated API on port 3107 using a temporary data directory. It refuses to reuse an existing server, cleans up test data on shutdown, and records trace/screenshots on failure. No real `.data` records are changed.

The browser scenarios cover admin create/edit, mandatory password change with confirmation errors, login persistence across reload, CSRF-protected draft save, non-admin navigation, password reset and disabled-user session revocation, re-enable, logout, expired-session handling and English/Vietnamese labels. Admin account forms support name/email/department/role and administrator status. Form-specific permissions remain step 3.

User edits revoke sessions so role/account changes take effect immediately; editing your own account returns you to login. Admin screens report API failures and require confirmation before disabling a user or resetting a password. Existing request navigation still protects unsaved input before logout or changing screens.

References: [Node crypto scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
