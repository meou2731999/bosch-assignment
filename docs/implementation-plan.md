# Staged implementation

Each stage is implemented and reviewed before continuing.

- [x] 1. Backend accounts, login/session, password changes/reset and session revocation.
- [x] 2. Login UI and admin account management with Chromium account flows.
- [x] 3. JSON form store, draft/published versions, per-form grants and legacy migration.
- [x] 4. Basic field editor, ordering, input/data types, validation, preview/publish and schema-driven request validation.
- [x] 5. Multi-select, nested objects, repeating groups, tables and nested conditional visibility with row/parent scope.
- [x] 6. Draft upgrades: diff, migration preview/confirmation, snapshots, restore, revision conflicts and audit; submitted requests retain their schema.
- [x] 7. Full end-to-end flow, CI, documentation and release-independent schema evidence.

Stage 4 preserves all existing JSON and published versions. Custom drafts use a flat typed field schema; legacy IT templates keep their existing validation path. See [forms and permissions](forms-and-permissions.md) for contracts, validation policy and browser evidence. All authored code stays at or below 200 lines with ESLint/SonarJS checks. Verification: unit/API, typecheck/build and Chromium field-builder/account/form flows.

Step 5 adds recursive fields and declarative scoped visibility with shared frontend/backend evaluation. Custom advanced schemas use a React renderer through the form adapter; basic/legacy forms keep Form.io. Published versions and request pinning remain unchanged. Verification: 57 unit/API tests and 8 headed Chromium scenarios; `npm run check` and `npm run test:e2e:headed`. Steps 6–7 are documented below.

Step 6 adds confirmed request-draft upgrades, schema/data diff previews, atomic per-revision snapshots, exact historical restores and transition audit. Only owners with create permission can change saved drafts; submitted requests remain pinned. See [draft upgrades](draft-upgrades.md) for policy/contracts. Verification: 77 unit/API tests and 10 headed Chromium scenarios via `npm run check` and `npm run test:e2e:headed`. Step 7 is documented below.

Step 7 connects publication, scoped grants, draft, strict upgrade, submission and approval in a production-bundle browser scenario. SHA-256 and unchanged document time origin provide bounded evidence of schema changes without a frontend release. GitHub Actions runs locked Node 24 checks/headless Chromium and retains HTML/trace/schema evidence; hosted execution awaits a GitHub remote. README, proposal PDF, architecture, runbook and acceptance boundaries are current. Verification: 77 unit/API tests, 11 headed Chromium scenarios and the same headless CI test command. See [final handoff](handoff.md) and [verification](verification.md). All seven local implementation stages are complete; independent candidate review and customer acceptance remain pending.
