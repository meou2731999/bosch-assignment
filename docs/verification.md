# Verification record

Executed by the assistant on 9 October 2026. These are local engineering checks, not customer acceptance or independent candidate review.

## Automated and build checks

- `npm test`: **11 / 11 service tests passed** with Vitest 5.0.3.
- `npm run build`: strict TypeScript check and Vite production build **passed**.
- `npm run check`: combined test and build **passed** after the final application changes.
- `npm audit`: **0 known vulnerabilities** in the locked dependency tree at the time of the check.
- Built-mode server smoke: homepage, health endpoint and active-form endpoint returned **200** using an alternate local test port.

The build emits a bundle-size warning: approximately 2.09 MB minified JS / 610 KB gzip, plus 282 KB CSS / 42 KB gzip. The warning is disclosed rather than suppressed.

## Browser observations

| Check | Observed result |
| --- | --- |
| Empty final submit | Visible title/type/reason validation errors and focused error summary |
| Equipment condition | Equipment selector and quantity appear |
| Software condition | Application and duration appear after switching; equipment panel disappears |
| Draft save | API-backed Draft status, revision 1 and activity event appear |
| Locale switch | EN/VI labels/options change while entered values remain |
| Injected API failure | 503 message appears; entered software values remain visible |
| Retry final submit | Submitted status, revision 2 and read-only fields appear |
| Sam's list | Only Sam's own seeded request appears |
| Reviewer | Can open Alex's seeded request; no save/submit action |
| Existing submission | Pinned v1 schema renders saved analytics application and 90-day duration |
| Runtime v2 activation | Additional notes appears on a new request without frontend rebuild; old record stays v1 |
| Mobile width | At a 390 px viewport, document clientWidth and scrollWidth were both 390; basic layout inspected |

`forms/active.json` was restored to version 1 after verification. The browser checks were interactive, not a committed automated end-to-end suite. Render updates are asynchronous; wait for the relevant field or saved status before the next demo action.

## Direct HTTP observations

- Saved request was `submitted`, revision 2; persisted data contained software fields and **no stale equipment/quantity fields**.
- Reading Alex's record as Sam returned **404**.
- Access without a recognized demo identity returned **401**.
- Creating a request as the reviewer returned **403**.

## Document checks

The proposal contains eight pages. All eight were rendered and visually inspected for clipping, overlap, table alignment and legibility. The editable architecture SVG and Mermaid source are included.

## Remaining verification

Full keyboard/screen-reader and cross-browser testing; real file upload/scan/download; actual product authentication; workflow integration/retry behavior; concurrent multi-process persistence; load/performance testing; end-to-end customer UAT and business sign-off. Some renderer hints and API error text remain English. These are explicit limits, not passing checks.
