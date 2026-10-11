# Request Desk - dynamic form assessment

A React/Express implementation with session login, admin account and form management, per-form permissions, JSON-driven requests, real local attachments, review decisions and versioned draft history. All accounts and data are synthetic. The seven implementation stages are complete; customer integration and business acceptance are separate work.

## Run locally

Use Node.js **24** and npm; no hosted Form.io account, API key, database or Docker is required.

```sh
npm ci --include=dev
# Supply ADMIN_EMAIL and ADMIN_PASSWORD in the environment:
npm run bootstrap:admin
npm run dev
```

Open **http://127.0.0.1:5173**; the API uses **http://127.0.0.1:3001**. Bootstrap refuses to replace an existing active administrator. See [authentication](docs/authentication.md) for account/password/session details. `.env.example` documents settings; the app does not load `.env` automatically. Set the same `DATA_DIR` for bootstrap and server when overriding `.data`.

New accounts must change their initial password and sign in again. New accounts, including admins, have no form grants. Admin status permits account/form management and reading requests; create and review rights require explicit per-form grants. Legacy Alex/Sam/Morgan accounts start disabled until reset and enabled by an admin.

```sh
npm run check                 # lint, format, 77 unit/API tests, typecheck/build
npx playwright install chromium
npm run test:e2e:headed       # 12 visible Chromium scenarios, isolated data
npm run test:e2e              # same scenarios headless, used by CI
npm start                    # built app + API, after npm run build
```

Stop the development API before `npm start`; both use port 3001. Browser tests use port 3107 and disposable temporary accounts/data, never your `.data`. The locked toolchain is currently verified on Node 24.19.0/npm 12.0.2 on macOS; CI targets Node 24 on Ubuntu 24.04.

## Try the complete journey

1. Sign in as admin, create a form type under **Manage forms**, enable **Use custom fields**, configure fields, preview, save and publish.
2. Create a requester and reviewer under **Manage users**. Grant **Create requests** to the requester and **Review requests** to the reviewer for this type. Each signs in and changes their initial password.
3. As requester, select the type, fill values and upload an optional PDF/PNG/JPG/TXT file (three files maximum, 5 MB each). Save an incomplete draft and reopen it. Supplied values must be valid even when required fields are omitted.
4. Publish a newer schema as admin. **New request** loads the new definition without a frontend build or document reload. Existing requests retain their pinned version.
5. On the saved draft, use **Refresh versions → Preview upgrade**. Inspect schema/data changes, correct every invalid value and required field, and choose **Validate preview changes**. Confirmation is blocked until the target schema validates. Cancel leaves the original draft unchanged.
6. Confirm the upgrade. Save later changes or select a previous saved revision and preview/confirm an exact restore of its data, schema version and files. Restoring creates a new revision and retains audit/history.
7. Submit the complete draft. Inputs become read-only. As reviewer, open the request, inspect files and approve or reject with a reason. Final decisions are immutable.
8. Publish another version and reopen the submitted request: its data and historical schema remain unchanged.

English/Vietnamese switching preserves live data. Unsaved navigation asks before discarding input. **Demo controls** can simulate one failed save; retry retains input. Revision conflicts require explicit reload rather than silent overwrite.

## Delivered behavior and boundaries

| Area           | Current behavior                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication | Server-issued HttpOnly session cookie, scrypt passwords, CSRF checks, forced changes, reset/revocation and process-local login throttling; no SSO |
| Authorization  | Server-enforced owner and per-form create/view/review grants; self-review prohibited                                                              |
| Authoring      | Restricted field editor, preview, immutable publication and active version per form                                                               |
| Rendering      | Form.io for legacy/basic schemas; React structured renderer for multi-select, objects, repeat/table and scoped conditions                         |
| Rules          | Nested AND/OR with root/row/parent scopes; shared custom-field visibility and validation; legacy rules keep their existing validator              |
| Requests       | Real HTTP saves, optimistic revisions, pinned schemas, drafts/submission/review audit                                                             |
| Files          | Real local bytes, policy/signature checks, authorized preview/download; no antivirus/quarantine or cloud retention                                |
| History        | Atomic request/snapshot/audit writes, strict confirmed upgrades, exact historical restore                                                         |
| CI             | GitHub Actions configuration for checks/headless Chromium and evidence artifacts; hosted execution awaits a GitHub remote                         |
| Acceptance     | Local automated evidence; customer UAT, candidate review and production acceptance remain pending                                                 |

The single-process JSON/file store, in-memory sessions/rate limits and local audit are demo infrastructure. Replace them with the existing product's database, session, approved file service and reliable workflow dispatch for production. The app binds to loopback by default. No production readiness, accessibility conformance or SonarQube server Quality Gate is claimed.

## Contracts and code map

All `/api` endpoints except health and login require a verified session. Mutations require `X-Requested-With: RequestDesk` and `X-CSRF-Token`; `x-demo-user` is ignored. The API derives owner/status/audit and rejects forged values. Request PUT includes `{revision,formId,formVersion,action,data,attachments}`. Existing ordinary saves cannot change the pinned version. See [forms and permissions](docs/forms-and-permissions.md) and [upgrade/restore protocol](docs/draft-upgrades.md).

- `src/app/`: shell, selected request and async load/navigation state.
- `src/features/forms/`: authoring, `DynamicForm` and structured inputs.
- `src/features/requests/`: save/review/file/history UI and HTTP adapters.
- `shared/`: contracts, field parsing, validation and scoped visibility.
- `server/`: auth, form publication, request policy, snapshots and local files.
- `tests/`, `e2e/`: isolated unit/API and real production-bundle Chromium tests.
- `.github/workflows/check.yml`: runnable CI checks and report retention.

Renderer state stays behind `FormHandle`; React owns product/network state. `DynamicForm` selects the compatible rendering path. Changing engines still requires schema/behavior mapping and regression tests. Published definitions and existing request contracts are preserved. ESLint enforces at most 200 lines in every authored JS/TS file.

## Evidence and handoff

Start with [final handoff](docs/handoff.md), [verification record](docs/verification.md), [browser instructions](docs/browser-tests.md) and [schema-only release evidence](docs/release-independent-schema.md). The HTML browser report contains bundle hashes and a schema-change JSON attachment. Generated reports/screenshots are ignored and replaced on the next run.

The current [proposal](docs/proposal.md) and `docs/solution-proposal.pdf`, [architecture](docs/architecture.md), [decisions](docs/decisions.md), [delivery estimate](docs/delivery.md), [risks](docs/risks.md), [UAT plan](docs/uat.md) and [demo script](docs/demo-script.md) distinguish implemented local behavior from proposed customer integration.

OpenAI Codex drafted code, tests and documentation and executed the recorded checks. Independent candidate review/rehearsal and business sign-off have not been recorded. Before submission, review the implementation, rerun the demonstration and explain the decisions in your own words. No employer code, real customer data or credentials are included.
