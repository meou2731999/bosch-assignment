# Schema changes without a frontend release

The reproducible evidence is `e2e/release-independent.spec.ts`, executed against the production Vite bundle and a disposable API store. It connects publication, scoped grants, a requester draft, strict upgrade, submission and reviewer approval.

## What the test proves

- Before configuration changes, compute SHA-256 and byte length for `dist/index.html` and every sorted `dist/assets` file.
- Publish v1, grant separate requester/reviewer access and save a v1 draft.
- Publish v2 with tighter validation, required Contact and a new `handoffReference` field using supported text input.
- In the existing requester document, New request renders the new field, while reopening the v1 draft excludes it.
- Correct/validate the upgrade candidate and explicitly confirm. Enter the new field, submit and approve as the reviewer; persisted data and read-only rendering use v2.
- Require the requester's `performance.timeOrigin` to remain unchanged, proving no full document navigation during schema discovery, draft upgrade and submission.
- Require the full on-disk bundle manifest to match the baseline and each served artifact's SHA-256 to match. No frontend build/deployment occurs between the two measurements.
- Assert final audit actions and no captured requester/reviewer runtime errors.

## Reproduce and inspect

```sh
npm ci --include=dev
npx playwright install chromium
npm run test:e2e:headed -- e2e/release-independent.spec.ts
npx playwright show-report --host 127.0.0.1
```

Open the scenario's **release-independent-schema-evidence** JSON attachment in the HTML report. It records form/version IDs, before/after manifests, the unchanged requester document assertion, new field key, draft/submitted/approved versions and audit actions. The screenshot is `test-results/release-independent-approved.png`. Reports are generated locally, ignored by Git, and uploaded by the configured CI workflow when it runs.

## Limits

This proves a supported declarative configuration change against one existing frontend/backend build. It does not prove arbitrary future input kinds, arbitrary scripts, changed domain contracts or external workflow integrations can avoid a release. The backend still validates every write; saved/submitted requests retain historical definitions. SHA-256 is evidence of identical assets, not a security certification or a claim that hosted CI has run.
