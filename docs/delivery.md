# Delivery estimate and team plan

## Assessment timebox

Suggested planning budget: 10-12 candidate hours across five calendar days, as requested by the assignment. A reasonable allocation is 1.5 h discovery/scope, 4.5 h prototype, 2 h verification, 2 h proposal and 1 h rehearsal (11 h). This is a planning allocation, not a claim about independently logged candidate work.

## Proposed customer pilot

**Planning estimate: 4 calendar weeks, 38 base person-days + 8 contingency = 46 person-days.** This is an estimate for integration into the existing product, not the assessment prototype and not a commercial commitment. Re-estimate after API, workflow and file-storage discovery.

| Work package | Base person-days | Acceptance evidence |
| --- | ---: | --- |
| Discovery, access rules, API and acceptance contract | 5 | Signed scope, sample requests, endpoint and permission matrix |
| React integration, conditional UI, draft/reload, languages | 10 | Demonstrated end-to-end happy/error paths in sandbox |
| Real identity/authorization, persistence, file service, workflow/status | 10 | Backend contract tests, file controls, traceable workflow handoff |
| Verification, UAT support, fixes, rollout and handover | 8 | UAT evidence, regression checks, rollback rehearsal |
| Technical leadership, reviews and documentation | 5 | Reviewed increments, operational guide and decision log |
| **Base** | **38** | |
| Contingency (approximately 21%) | 8 | API gaps, rule clarification and UAT rework |
| **Total capacity** | **46** | |

Indicative capacity over four weeks: senior frontend/solution engineer 20 days, junior frontend 10, backend engineer 8, QA 6, product/UAT owner 2 = 46. Customer test participants supply additional scheduled availability. Team allocations are assumptions; parallel work depends on stable interfaces. No salary, license or infrastructure price is assumed.

## Milestones

- **Week 1 - agree and prove:** confirm rules and roles, obtain sandbox/API/file contracts, select representative form, prove one authenticated save/reload path. Exit: business owner accepts scope and backend lead accepts contract.
- **Week 2 - complete the journey:** conditional fields, drafts, final submit, errors, languages and file integration. Review actual user feedback twice during the week.
- **Week 3 - integrate and verify:** existing workflow/status, audit, form version publication controls, permission regression, accessibility/performance checks. Exit: UAT entry criteria satisfied.
- **Week 4 - accept and release:** run UAT, triage/fix/retest, obtain sign-off, pilot rollout and handover. If API/file access is delayed or critical defects remain, move the release date or reduce agreed scope; do not compress validation silently.

## Leadership and junior-engineer support

The solution engineer owns discovery, integration decisions, API contract, risk communication and acceptance evidence. Give the junior engineer bounded tasks: request list/status UI, translated copy, and attachment metadata presentation, each with examples and explicit acceptance criteria. Pair on one Form.io lifecycle integration before independent work.

Require a small pull request per behavior. Review loading/error states, server authority, accessibility and meaningful tests, not only appearance. Backend ownership remains with the backend engineer; QA leads test execution; the business UAT owner decides acceptance. Use short daily unblock sessions and two demos per week. Record decisions and update the estimate when scope changes.

## Handling a panel/customer change

Example: "Equipment above a cost threshold needs a second approver." Ask for currency, threshold, decision owner, affected requests and urgency. It adds a cost field/validation, backend approval policy, workflow routing, status history, permission checks and UAT cases. Recommend an impact spike before commitment. Initial illustrative increment: 2-4 person-days if the existing workflow supports conditional routing; larger if it does not. Business owner chooses between moving release, swapping a lower-priority item or deferring the feature. Existing submitted requests keep their original policy unless an explicit migration is agreed.
