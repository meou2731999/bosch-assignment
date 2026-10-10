# Final handoff - step 7

11 October 2026. All seven implementation stages are complete locally. See [verification](verification.md) for measured checks and [implementation plan](implementation-plan.md) for stage history.

## Setup and operation

1. Install Node 24, run `npm ci --include=dev`, supply `ADMIN_EMAIL` / `ADMIN_PASSWORD` through the environment and run `npm run bootstrap:admin`.
2. Start `npm run dev` and open port 5173, or run `npm run build` then `npm start` on port 3001. Use the same `DATA_DIR` for bootstrap/server; `.env` is not loaded automatically.
3. Create/publish forms and explicitly grant create/view/review. New accounts change their initial password and sign in again. Administrative status does not imply create/review rights.
4. Use [demo script](demo-script.md) and [schema-only evidence](release-independent-schema.md) for review. Run checks with disposable test data; browser tests never use `.data`.

## Storage, backup and recovery

`.data` holds users, forms, requests/snapshots and file metadata/bytes. Keep the directory private and out of Git. Stop the API before copying/restoring the entire data directory; do not restore only request JSON while losing referenced schemas/files. Sessions are in memory, so all users sign in again after restart. Keep the previous data backup when changing application versions. There is no automatic cross-version database downgrade or distributed backup protocol.

A conflict requires explicit request reload and a fresh preview. A missing historical version or file blocks restore without writing a new revision. Failed saves preserve browser input; an unknown network outcome must be reconciled by reload/revision rather than assuming failure. Publication affects new requests only; the UI does not expose an active-version rollback endpoint. Retain immutable historical versions and use an explicit corrected publication for future requests.

## CI

`.github/workflows/check.yml` targets GitHub Actions on push to main, pull requests and manual dispatch. It installs locked development dependencies on Node 24/Ubuntu 24.04, runs `npm run check`, installs Chromium/system dependencies and runs the complete headless browser suite. A read-only token, cancellation per branch, job/test timeouts, forbidden focused tests and 14-day browser artifacts are configured. No automatic deploy or secrets are required.

The workflow follows [Playwright CI guidance](https://playwright.dev/docs/ci) and official [setup-node](https://github.com/actions/setup-node), [checkout](https://github.com/actions/checkout), [upload-artifact](https://github.com/actions/upload-artifact) actions. This checkout has no Git remote, so hosted execution cannot be asserted. Push the reviewed repository to GitHub to obtain actual CI run evidence; local headed/headless results are separate.

## Review and acceptance

Review permission boundaries, supported schema limits, legacy compatibility, strict invalid-value upgrade policy, hidden/removed-value changes and file/snapshot retention. Every authored JS/TS file is limited to 200 lines by ESLint. Production bundle/CSS warnings remain visible.

Customer SSO/database/workflow, scanning/quarantine/retention, distributed transactions/sessions, load/performance budgets, complete accessibility/cross-browser verification, independent candidate rehearsal and business UAT/sign-off remain pending. Local tests and local SonarJS rules do not establish production readiness or a SonarQube server Quality Gate.

Current source, lockfile, CI, automated tests, README, contracts, architecture, proposal PDF, demo/runbook and evidence instructions are included. Rebuild the four-page PDF with `uv run --with reportlab python scripts/build-proposal.py`; the script reads `docs/proposal.md` and requires only the optional document dependency, not an application runtime dependency. AI-assisted work and unrecorded independent candidate review remain disclosed. No real customer data or credentials belong in the handoff.
