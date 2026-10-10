# Verification record - final local implementation

Executed by the assistant on **11 October 2026**, on macOS with Node 24.19.0/npm 12.0.2. These are local engineering checks, separate from hosted CI, customer acceptance and independent candidate review.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run check` | Lint/SonarJS, formatting, 77 unit/API tests, strict TypeScript and production Vite build pass |
| `npm run test:e2e:headed` | 11/11 Chromium scenarios pass against the real production bundle and isolated API |
| `CI=true npm run test:e2e` | The same 11/11 scenarios pass headless with CI focused-test protection |
| Workflow validation | GitHub Actions workflow checked with actionlint 1.7.12 |
| PDF | Current four-page proposal rendered and visually inspected |
| `git diff --check` | No whitespace errors |

Tests cover sessions/passwords/CSRF, per-form grants, immutable published definitions, safe recursive parsing, shared custom validation/visibility, legacy compatibility, real file bytes/access, snapshots/restarts, failed atomic writes, strict upgrades, exact restoration and stale revisions/publications. Browser evidence covers account/admin/request/review journeys, seven basic inputs, collections/scoped conditions, failures/retries/locales and strict upgrade/restore.

The integrated step-7 scenario proves a new supported JSON key renders and persists in an existing requester document, a v1 draft stays pinned until explicit upgrade, and the v2 submission remains unchanged through approval. SHA-256 manifests and served-asset hashes match before/after configuration changes. See [bounded schema-only evidence](release-independent-schema.md) and its HTML JSON attachment.

## Build warnings and limits

The production bundle includes Form.io and is approximately 2.21 MB minified / 644 KB gzip, plus 295 KB CSS / 44 KB gzip. Vite reports a chunk-size warning and CSS optimization reports two Bootstrap `@charset` warnings; neither is hidden or treated as a passing performance budget. No dependency audit or SonarQube server Quality Gate was run as part of this stage.

Only Chromium is automated. Complete accessibility/screen-reader, Safari/Firefox, target-device performance/load, product SSO/database/workflow, malware scanning/quarantine/retention, distributed persistence and customer UAT/sign-off remain unverified. Some technical diagnostics remain English. Local tests do not certify production readiness.

## Reproduce and retain evidence

```sh
npm ci --include=dev
npm run check
npx playwright install chromium
npm run test:e2e:headed
CI=true npm run test:e2e
npx playwright show-report --host 127.0.0.1
```

See [browser instructions](browser-tests.md) for screenshots/traces and the release-independent JSON report attachment. Generated reports are ignored and overwritten on the next browser run; retain a copy for a specific review/build. `.github/workflows/check.yml` uploads browser artifacts for 14 days when run on GitHub. This checkout has no remote and no hosted run evidence; local headless execution is recorded separately.

The proposal PDF and editable source now describe implemented sessions, real files, authoring, review and draft history. Older 9 October mock-header/metadata-only documentation is superseded. Candidate review/rehearsal and business acceptance have not been recorded.
