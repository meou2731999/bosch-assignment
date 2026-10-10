# Browser verification through step 7

Run `npm run test:e2e:headed` to see Chromium execute the eleven browser scenarios. Playwright builds the actual frontend, starts an isolated API on port 3107 and uses disposable test accounts/data. It never uses `.data` records.

For a reviewable HTML report:

```sh
PLAYWRIGHT_HTML_OPEN=never npm run test:e2e:headed -- --reporter=list,html
npx playwright show-report --host 127.0.0.1
```

The browser suite covers:

- Admin create/edit accounts, first-password change and confirmation mismatch, session persistence, reset, disable/re-enable, logout, invalid login and expired sessions.
- Form publication, scoped create grants and revocation, requester catalog, old draft version preservation.
- Field add/edit/remove/reorder/preview, required and numeric validation, all seven basic inputs with persisted types, and loading newly published JSON in the same browser document without a frontend release or page reload.
- Recursive advanced-field editor/preview, multi-select, nested objects, repeating groups and tables; nested AND/OR visibility across row/parent/root scopes, row isolation, identical frontend/direct-API validation errors, hidden-value removal, draft reload and read-only submission.
- Integrated publish/grant/draft/upgrade/submit/review journey with a new JSON field, unchanged requester document and SHA-256 comparison of built/served frontend assets. The HTML report includes `release-independent-schema-evidence` JSON.
- Confirmed draft upgrades and snapshot restores: schema/data diff, candidate preview, cancel, unsaved-input gating, required fields, restoring a removed file, publication/save conflicts, explicit reload and submitted schema preservation.
- Legacy equipment/software conditional sections, removal of hidden payload values, English/Vietnamese changes without losing input and cancelling unsaved navigation.
- TXT upload/preview/download (including byte comparison), PNG rendering, PDF preview iframe, attachment removal, maximum three files, invalid extensions and mismatched file signatures.
- Submit and read-only requests, reviewer attachment access, rejection requiring a reason, approval, immutable final decisions and visible audit comments.
- Simulated failed saves retaining input, retry, stale revision rejection and explicit reload of the server revision. Saved conditional sections are hydrated before Save draft is enabled, and remain visible in read-only submitted requests.

Unit/API tests cover server-side authentication, CSRF, permission bypasses, schema safety, all basic validators, session revocation, persistence/restarts, migrations and concurrency. Run `npm test` separately; browser automation does not replace these checks.

Evidence screenshots are written to `test-results/admin-users.png`, `form-permissions.png`, `field-editor-preview.png`, `request-recovery.png`, `review-approved.png`, `advanced-editor-preview.png`, `advanced-request.png`, `draft-upgrade-preview.png`, `draft-restored.png`, `draft-upgrade-conflict.png` and `release-independent-approved.png`. Failed browser checks retain screenshots and a trace; HTML output goes to `playwright-report/`. These generated artifacts are ignored by Git and replaced on the next browser run.

Steps 5–6 cover nested fields and strict validated draft migrations/snapshots. Step 7 adds the integrated journey, CI artifacts and [final handoff](handoff.md). See [schema-only evidence](release-independent-schema.md) for the supported change and its limits. PDF verification checks the preview container and download link; it does not validate browser PDF rendering fidelity.
