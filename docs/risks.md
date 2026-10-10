# Risk register

Likelihood/impact: Low, Medium, High. These are assessment judgments; named customer owners must replace the role placeholders in discovery.

| ID | Risk | Likelihood / impact | Mitigation and trigger | Owner |
| --- | --- | --- | --- | --- |
| R1 | Product API/auth/workflow differs from assumptions | M / H | Prove one authenticated round trip in week 1. Escalate if sandbox or contract is missing after discovery. Re-estimate integration. | Solution + backend leads |
| R2 | JSON rules and server policy drift | M / H | Version schema and contract together; retain old versions; test both conditional branches. Block publication when server compatibility is unknown. | Backend lead |
| R3 | A configuration author introduces unsafe scripts or external endpoints | M / H | Trusted authors only, component/URL allowlist, review and preview before publish. No public schema upload in prototype. | Security/product owner |
| R4 | Role/ownership leak exposes another user's request | M / H | Derive identity from real session, enforce scoped API queries, negative tests. Local sessions/CSRF are implemented; product SSO and distributed controls remain rollout work. | Backend/security lead |
| R5 | File content creates malware, access or retention risk | M / H | Reuse approved file service with size/type checks, scan/quarantine, access-controlled download and retention. Local bytes/signature/access checks are implemented; no scan/quarantine/retention claim. | Storage/security owner |
| R6 | Renderer update, unsupported component or maintenance issue blocks a requirement | M / M | Pin lockfile, keep wrapper small, run representative schema regressions before upgrades, monitor advisories/releases. Do not infer abandonment from one repository's commit gap. | Frontend lead |
| R7 | Form changes alter historical meaning or break submissions | M / H | Immutable published versions, pinned records, rollback active pointer, explicit migration only. | Product/backend owner |
| R8 | Large bundle or form complexity harms slower devices | M / M | Measure cold load and interaction on target devices; lazy-load product form route. See verification.md for the measured production bundle. | Frontend lead |
| R9 | Late workflow changes expand UAT and delivery | H / M | Weekly scope review, examples and acceptance criteria; assess impact before commitment; retain 8 person-day contingency. | Solution engineer + sponsor |
| R10 | UAT lacks owners or stalls without sign-off | M / H | Book testers early, set severity/exit criteria, daily triage and evidence log; sponsor resolves scope vs release. | Business UAT owner |
| R11 | Retry/timeout triggers duplicate workflow work | M / H | Stable request ID + revision in demo; use existing transaction and reliable dispatch/idempotency facilities in product. Test unknown-outcome recovery. | Backend lead |
| R12 | Product edition/support terms differ from expectations | M / M | Verify selected components, deployment and support terms with vendor/procurement. No enterprise capability or pricing is assumed. | Product/procurement owner |

Residual limits: the file store, process-local sessions, partial localization, files without malware scanning, absence of screen-reader/load testing and lack of real customer UAT are documented. Passing unit tests and a dependency audit does not establish production readiness.
