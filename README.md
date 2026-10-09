# Authentication update

The backend now requires session login. See [authentication setup and API](docs/authentication.md). Sign in with a bootstrapped admin to create and manage user accounts. Each new user must change their initial password.

# Request Desk - dynamic form assessment

A small working React prototype for the supplied Solution Engineer assignment. Form.io renders trusted JSON definitions; the application owns identity context, request records, persistence and status. All users and records are synthetic.

## Run locally

Use Node.js **24 LTS** and npm. No Form.io account, API key, database installation or Docker is needed.

```sh
npm ci --include=dev
# Supply ADMIN_EMAIL and ADMIN_PASSWORD in the environment, then:
npm run bootstrap:admin
npm run dev
```

Open **http://127.0.0.1:5173**. The API listens on **http://127.0.0.1:3001**. Keep both ports available. Stop with Ctrl+C. Vite proxies `/api` to port 3001; if changing the API port, change `vite.config.ts` as well. `.env.example` documents the optional `PORT` environment variable; this project does not automatically load `.env` files.

```sh
npm test        # unit and API integration tests
npm run build  # strict TypeScript check + production bundle
npm run check  # lint, formatting, unit/API tests and build
npm run test:e2e # isolated Chromium browser account flows
npm start      # serves the built application + API on port 3001
```

Stop the dev API before `npm start`, because both use port 3001. Run `npm run build` before `npm start`. The production build command produces a runnable bundle; the application's authentication remains a local demo.

Dependencies are pinned in `package-lock.json`. Tested with Node 24.19.0 and npm 12.0.2 on macOS. Runtime: React 19.1.1, `@formio/react` 6.2.1, `@formio/js` 5.6.1, Express 5.1.0. Tooling: Vite 7.3.7, Vitest 5.0.3. `npm audit` reported zero known vulnerabilities in the locked tree on 9 October 2026; this is a point-in-time check, not a security certification.

## Try the demo

1. Sign in as admin, reset and enable **Alex Nguyen**, then sign out and sign in as Alex. Change the initial password and sign in again. Choose Equipment; fill in the title, equipment, quantity and business reason.
2. Select **Save draft**. An incomplete draft is allowed; any supplied numeric value must still be valid. Open a different request, then reopen the draft.
3. Switch request type to Software access. The second conditional section appears. Values from the inactive section are discarded on save.
4. Switch English / Vietnamese without losing the entered values.
5. Open **Demo controls**, select **Simulate failure on next save**, and save or submit. The API returns 503; input remains visible. Retry succeeds.
6. Submit a complete request. Status becomes Submitted, fields become read-only and an audit event is added.
7. After resetting/enabling Sam and Morgan from the admin screen, sign out and sign in as **Sam Patel**: Alex's requests are absent. Sign in as **Morgan Lee / Reviewer**: all requests are visible. Submitted and In review requests have Approve/Reject controls; rejection requires a reason. Decisions and comments appear in Activity.
8. Open the seeded Analytics request to show an existing submission, In review status and history. The seeded Monitor request shows Approved.

Final submission requires title (3-80 characters), business reason (10-500), request type, and the relevant section. Equipment quantity is 1-25; access duration is 1-365 days. These are explicit demo assumptions, not confirmed customer policies.

### Change a form without rebuilding the frontend

Change `forms/active.json` from `{"version": 1}` to `{"version": 2}`, then click **New request**. An optional Additional notes field appears. Reopen an existing v1 request: it still loads v1. Set the active version back to 1 after the demonstration. No frontend build or API restart is required; the API reads the fixtures when requested.

The v2 field is already accepted by the backend. Labels, supported layouts and existing field visibility can be configured without frontend code changes. New stored fields or business rules may require backend contract changes. This is not unrestricted no-code application development. Published versions should be immutable in a real product; the demo relies on file discipline rather than a publishing system.

### Persistence and reset

Data is stored locally in `.data/requests.json` after the first save. On a fresh run, the API loads two seed records. To reset, stop the server and rename `.data/requests.json` to a backup filename, then restart. The zip excludes local test data, dependencies and build output.

## What is real and what is simulated?

| Capability                    | Delivered                                                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON loading + React renderer | Real API fetch; Form.io JSON is passed to `Form` through `DynamicForm`                                                                               |
| Conditional UI + validation   | Two distinct panels, built-in client validation and independent API validation                                                                       |
| Identity                      | Mock user switcher and `x-demo-user`; anyone can impersonate a demo user                                                                             |
| Authorization behavior        | API checks role/ownership; this only demonstrates policy under a simulated identity                                                                  |
| Draft, submit, reload         | Real HTTP requests and local file persistence; final records are read-only                                                                           |
| Attachments                   | **Metadata only**: filename, type, size. No upload, download, scanning or stored file bytes                                                          |
| Approval                      | Reviewer approve/reject with comments, revision checks and persisted audit; no external workflow integration                                         |
| Languages                     | English/Vietnamese application copy and form labels/options/primary validation; API diagnostics and some renderer accessibility hints remain English |
| Audit                         | Server-generated actor/time/action on writes; local file, not immutable or compliance-grade                                                          |
| Existing product integration  | Demonstrated API boundary; no access to the customer's actual backend                                                                                |
| Form authoring                | Two author-managed JSON fixtures; no builder, admin UI or publishing workflow                                                                        |

## Code map

```text
src/app/Workspace.tsx         Application shell, list and request editor
src/features/forms/DynamicForm.tsx Form.io lifecycle, locale and renderer boundary
src/features/requests/api.ts         HTTP adapter and error parsing
src/i18n/        English/Vietnamese presentation strings
shared/model.ts    Request, user, attachment and API contract types
forms/             Versioned Form.io definitions and active pointer
server/index.ts    HTTP routes, fixture loading and local persistence
server/requests/service.ts  Validation, authorization and status/revision rules
server/seed.ts     Synthetic existing submissions
tests/             Service tests covering business/security boundaries
docs/              Proposal, architecture, decisions, delivery, risks and UAT
```

React state holds the selected record, identity, language and network state. Form.io holds live field state. A ref reads the renderer data on save; we do not duplicate every keystroke into a global store. Changing records remounts the renderer; changing language preserves data. A dirty guard protects navigation/reload. Pending saves disable actions and inputs. Failed saves retain input; validation feedback and API errors are visible. Old asynchronous loads cannot replace a newer selection.

`DynamicForm` is a small integration boundary, not an engine-independent schema translator. The schema, rules and field types remain coupled to Form.io. Replacing the renderer later would still need mapping and regression testing.

## API contract

Every `/api` endpoint except `/api/health` requires `x-demo-user: alex|sam|morgan`.

| Method | Path                            | Result                                          |
| ------ | ------------------------------- | ----------------------------------------------- |
| GET    | `/api/forms/request`            | Active `{version, definition}`                  |
| GET    | `/api/forms/request/versions/1` | Pinned definition (1 or 2)                      |
| GET    | `/api/requests`                 | Visible records for the actor                   |
| GET    | `/api/requests/:id`             | Existing record; hidden/nonexistent returns 404 |
| PUT    | `/api/requests/:id`             | Create/save/submit a record                     |

PUT body:

```json
{
  "revision": 0,
  "formVersion": 1,
  "action": "submit",
  "data": {
    "requestTitle": "Monitor for reporting",
    "requestType": "equipment",
    "equipment": "monitor",
    "quantity": 1,
    "reason": "A second screen helps with monthly reporting."
  },
  "attachments": []
}
```

The server sets owner, status, timestamps, audit and next revision. Errors are `{code, message, fields}` with 401/403/404/409/422/503/500 as appropriate. JSON bodies are limited to 128 KB. The schema fixtures are trusted developer input; there is no endpoint for uploading arbitrary schemas.

An existing request must use its current revision and original formVersion. IDs remain stable when retrying in the same editor, avoiding duplicate rows. After a timeout with an unknown outcome, a retry may return 409; reload to reconcile. This is optimistic concurrency, not a complete idempotent workflow/event-delivery solution.

## Boundaries before production

This local app binds to loopback and must not be exposed as an authenticated service. Replace the mock header with the existing product's verified session, move file persistence to the existing database, integrate approved file storage/scanning, and connect the existing workflow. Add scoped permissions, controlled form publication, operational logs, rollback and retention rules. The suggested work is estimated in `docs/delivery.md`.

The Form.io bundle is large: the measured production JS is approximately 2.09 MB minified / 610 KB gzip. Vite emits a size warning. Route-level lazy loading and a representative cold-load performance budget belong in product integration; a single-screen prototype does not need a custom tree-shaken form engine.

## Submission documents

- `docs/solution-proposal.pdf` and editable content in `docs/proposal.md`
- `docs/architecture.md` and `docs/architecture.svg`
- `docs/decisions.md`, `docs/delivery.md`, `docs/risks.md`
- `docs/uat.md`, `docs/verification.md`, `docs/demo-script.md`

## AI disclosure and sources

OpenAI Codex was used to draft the implementation, tests, diagrams and supporting documents and to execute local checks. The assistant reviewed the generated code against the assignment and verified selected flows via tests and browser interaction. **Independent candidate review and rehearsal have not yet been recorded.** The candidate should review and modify the solution, confirm the disclosure and explain the trade-offs before submitting it. No employer code, real customer data or credentials are included.

Official references checked 9 October 2026:

- [React wrapper and integration](https://github.com/formio/react)
- [Form renderer](https://help.form.io/dev/form-development/form-renderer)
- [Form JSON](https://help.form.io/form-building/form-json)
- [Authentication and authorization](https://help.form.io/dev/authentication-and-authorization)
- [Renderer source](https://github.com/formio/formio.js)

The installed `@formio/react` and `@formio/js` package metadata declares MIT licensing. This prototype uses the renderer packages only, not a hosted Form.io project or Enterprise server. Separate products, premium components, support and deployment rights must be verified against the selected offering before procurement. No paid capability is assumed in the demo.

## UI styling

Application components use Tailwind CSS 4 via the Vite plugin. Utilities use the `tw:` prefix to avoid collisions with the Bootstrap classes required by Form.io. `src/styles/index.css` declares tokens and vendor layers; `src/features/forms/formio.css` contains only scoped renderer adjustments. There is no application-wide legacy stylesheet. Translations live in `src/i18n/en.ts` and `src/i18n/vi.ts`, one file per language.

## Review decisions

`POST /api/requests/:id/review` accepts `{revision, decision: "approve" | "reject", comment}`. Only the reviewer may decide a Submitted or In review request. Rejection requires a trimmed, non-empty reason; approval comments are optional; comments are limited to 2,000 characters. The API owns the actor, timestamp, status and next revision. The requester can read the decision/comment in Activity. Approved and Rejected are terminal in this prototype; reopening/resubmitting is outside the requested change. Stale decisions return 409 and require reload.

## Code quality and formatting

Install development tools with `npm ci --include=dev` (also works when the local npm configuration omits dev dependencies).

- `npm run lint`: TypeScript, React Hooks and SonarJS recommended rules, with no warnings allowed.
- `npm run lint:fix`: apply available ESLint fixes.
- `npm run format`: format source code and configuration with Prettier. Documents in `docs/` and generated files are excluded.
- `npm run format:check`: verify formatting without changing files.
- `npm run check`: lint, formatting, tests and production build.
- `npm run test:coverage`: produce `coverage/lcov.info` for SonarQube. Coverage includes frontend source even though current tests focus on the backend.

SonarJS provides local static analysis; it does not run a SonarQube server scan or establish a passed Quality Gate. The configuration in `sonar-project.properties` supports a separate scan with an installed SonarScanner CLI after generating coverage:

```sh
npm run test:coverage
sonar-scanner -Dsonar.host.url="$SONAR_HOST_URL"
```

Set `SONAR_HOST_URL` and `SONAR_TOKEN` in the environment for your SonarQube instance. Keep credentials out of committed files. See the [SonarJS rules](https://github.com/SonarSource/SonarJS/blob/master/packages/analysis/src/jsts/rules/README.md) and [Prettier integration guide](https://prettier.io/docs/integrating-with-linters).
