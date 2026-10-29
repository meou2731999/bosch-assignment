# Operation, verification and acceptance

Setup: [README](../README.md). Technical policy: [architecture](architecture.md). Rehearsal: [presentation script](presentation-notes.vi.md).

## Local operation and recovery

Use Node 24; bootstrap/server must share `DATA_DIR` (default `.data`). `.env` is not auto-loaded. Dev web/API ports are 5173/3001; the built app uses 3001. Bootstrap refuses an existing active admin. New accounts need a password change and explicit form grants; grant/reset/account edits revoke sessions.

Keep `.data` private and out of Git. Stop the API before backing up/restoring the entire directory, including users, forms, requests/snapshots and file metadata/bytes. Never restore request JSON without its referenced schemas/files. Keep the previous backup when changing app versions; there is no automatic cross-version downgrade. Restart clears sessions.

Failed saves retain browser input. Unknown network outcomes require reconciling the stored revision before retry. Conflicts require explicit reload and fresh previews. Missing historical files/schemas block restore. Current publication recovery is a corrected new publication; active-pointer rollback UI is not implemented.

## Verification baseline

Executed **28 October 2026**, macOS, Node **24.19.0**, npm **12.0.2**:

- `npm test`: **93 tests / 25 files passed**.
- `npm run build`: TypeScript and production build passed.
- `CI=true npm run test:e2e`: **19/19 headless Chromium scenarios passed**.
- Lint and repository format checks passed. `docs/` is excluded by Prettier; document links/layout are checked separately.
- Proposal PDF: four pages. Presentation: 15 editable English slides with Vietnamese notes, visually reviewed.

The latest refresh also checks validated Form.io JSON import, paginated request history, browser back/forward navigation, and inline review from the request table.

Coverage includes auth/CSRF/revocation, permission bypasses, publication/pinning, blank forms/stable field IDs, supported JSON import, basic/nested fields and visibility, file bytes/access, snapshots/restarts/failed writes, upgrade/restore/conflicts, paginated request navigation and inline review, admin dialogs, menu focus, EN/VI and CSS/mobile spacing.

Vite 7.3.7 output: JS **2,249.39 kB / 655.04 kB gzip**, CSS **388.35 kB / 48.28 kB gzip**. The JS chunk-size warning remains; no Bootstrap charset warning appeared. Browser startup emitted a `NO_COLOR`/`FORCE_COLOR` environment warning. Sizes are observations, not accepted performance budgets.

## Reproduce and retain evidence

```sh
npm ci --include=dev
npm run check
npx playwright install chromium
CI=true npm run test:e2e
npx playwright show-report --host 127.0.0.1
```

For visible rehearsal: `npm run test:e2e:headed`; optionally prefix `E2E_SLOW_MO=500`. Slow mode allows three minutes per test and thirty minutes per suite. These modes were not rerun in the recorded refresh. Playwright builds the frontend, starts an isolated API on port 3107 and uses disposable accounts/data, never `.data`.

`e2e/release-independent.spec.ts` publishes a new supported JSON field, loads it in the same requester document, keeps a v1 draft pinned, upgrades to v2, submits and approves. The report attachment **release-independent-schema-evidence** records matching built/served SHA-256 hashes and unchanged `performance.timeOrigin`. This proves the tested configuration change needs no frontend build/deployment, not that arbitrary future inputs/operators/integrations do. The shared E2E server raises the per-IP login limit to 500 to avoid accumulating unrelated test logins; application and API tests retain the default limit of 50.

`playwright-report/` and `test-results/` contain HTML, screenshots and failure traces. They are ignored and overwritten on subsequent runs; copy evidence for a named review. PDF attachment tests check the preview container/download, not browser PDF rendering fidelity.

The GitHub remote is `meou2731999/bosch-assignment`. `.github/workflows/check.yml` runs Node 24/Ubuntu 24.04 checks and Chromium on main pushes, PRs and manual dispatch, retaining artifacts for 14 days. Hosted run status was not checked; no deploy is configured.

## Acceptance and risk gates

Customer UAT has not occurred. Agree process/field rules, scoped roles, translation/publication owners, file policy and measurable outcomes before a versioned sandbox trial. Representative users should cover:

1. Active form discovery, conditional validation, incomplete draft save/reload and EN/VI.
2. Own/other-user access, grant revocation, forbidden self-review and direct API bypass.
3. Real file upload/preview/download, size/type/signature rejection and historical references.
4. New publication, pinned old requests, upgrade/cancel/restore and stale revisions.
5. Submit, rejection reason, immutable final decisions and audit.
6. Blank form identity preservation, keyboard focus, mobile layout and failure recovery.

Record build, role, input, expected/actual result, evidence and defect owner. Unauthorized access, data loss or a core journey failure blocks acceptance. Exit requires all critical journeys passing, no open critical/high defects, accepted lower-severity issues with owners/dates, reviewed rollback/runbook and named business sign-off on the exact build/scope.

Production risks still include single-process storage/sessions, tenant isolation, unsafe files, incompatible schema changes and duplicate external delivery. The [roadmap](platform-roadmap.md) assigns gates for transactions, identity, scanning, migration and recovery. Full Firefox/WebKit, screen-reader, load, provider integration, dependency/security audit and SonarQube server Quality Gate are not claimed. Local checks do not certify production readiness; candidate review/rehearsal remains unrecorded.

## Maintain the documents

Keep runtime contracts in architecture.md, executed results here, planned scope in platform-roadmap.md and audience material in proposal.md/presentation-notes.vi.md. Avoid copying test counts into additional guides.

Rebuild the proposal with `uv run --with reportlab python scripts/build-proposal.py`. Slide text updates live in `presentation.json`; `scripts/build-presentation.mjs` reads them and the Vietnamese notes, using the optional Artifact Tool runtime described in its header. The v3 deck is a build template; the current reviewed deck is v6. Render and inspect changed artifacts before delivery. Document tools are separate from application dependencies.
