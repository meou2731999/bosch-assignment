# Staged implementation

Each stage is implemented and reviewed before continuing.

- [x] 1. Backend accounts, login/session, password changes/reset and session revocation.
- [x] 2. Login UI and admin account management with Chromium account flows.
- [x] 3. JSON form store, draft/published versions, per-form grants and legacy migration.
- [x] 4. Basic field editor, ordering, input/data types, validation, preview/publish and schema-driven request validation.
- [x] 5. Multi-select, nested objects, repeating groups, tables and nested conditional visibility with row/parent scope.
- [ ] 6. Draft upgrades: diff, migration preview/confirmation, snapshots, restore, revision conflicts and audit; submitted requests retain their schema.
- [ ] 7. Full end-to-end flow, CI, documentation and release-independent schema evidence.

Stage 4 preserves all existing JSON and published versions. Custom drafts use a flat typed field schema; legacy IT templates keep their existing validation path. See [forms and permissions](forms-and-permissions.md) for contracts, validation policy and browser evidence. All authored code stays at or below 200 lines with ESLint/SonarJS checks. Verification: unit/API, typecheck/build and Chromium field-builder/account/form flows.

Step 5 adds recursive fields and declarative scoped visibility with shared frontend/backend evaluation. Custom advanced schemas use a React renderer through the form adapter; basic/legacy forms keep Form.io. Published versions and request pinning remain unchanged. Verification: 57 unit/API tests and 8 headed Chromium scenarios; `npm run check` and `npm run test:e2e:headed`. Steps 6–7 remain pending for review.
