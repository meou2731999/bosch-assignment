# Backend authentication (step 1)

The API now requires server-issued sessions. `x-demo-user` is ignored. The existing frontend still uses demo identity and will require the login UI in step 2.

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
- `PATCH /api/admin/users/:id`: `{active:boolean}`; revokes target sessions. Enabling an account without a password and disabling the last active admin are rejected.

Authenticated mutations require `X-CSRF-Token` from login/session. Accounts with a required password change can only use session, logout and change-password endpoints. Administrative access is separate from the requester/reviewer role; form-specific permissions are step 3.

The cookie is HttpOnly, SameSite=Strict, scoped to `/api`, with an absolute eight-hour lifetime. Set `SECURE_COOKIES=true` when serving through HTTPS. Sessions are in memory and invalidated on API restart; user credentials persist in users.json. No CORS permission is enabled. Login requires JSON and a custom header, and limits attempts per email (10) and IP (50) per 15-minute window. Successful login clears the email counter; the IP window remains. Rate limits are process-local.

## Verification

`npm run check` runs Vitest unit/API tests and the TypeScript/Vite build. Tests create isolated temporary data directories. Authentication tests cover password hashing and bounds, duplicate/bootstrap races, persistence, session expiry/revocation, CSRF, impersonation rejection, forced changes, reset/disable/enable, admin boundaries, logout, restart and login throttling. Existing attachment API tests authenticate through login.

Browser automation and the account UI are deliberately scheduled for step 2.

References: [Node crypto scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback), [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
