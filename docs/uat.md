# UAT plan and sample scenarios

This is a proposed customer acceptance plan. Assistant-executed checks are recorded separately in `verification.md`; **customer UAT and sign-off have not occurred**.

## Ownership and entry criteria

Business process owner approves business outcomes and release; representative requester and reviewer users execute scenarios; QA coordinates evidence/retests; solution engineer triages and explains trade-offs; backend/security owners approve integration and permission controls.

Entry: agreed field/role/status rules, stable versioned build, deployed sandbox with real product authentication, synthetic test accounts, seeded records, available file/workflow endpoints, test instructions and known limitations reviewed. Run the local prototype scenarios now; file/workflow production cases remain pending integration.

## Scenarios

| ID | Scenario / steps | Expected outcome | Prototype coverage |
| --- | --- | --- | --- |
| U01 | Load new request from active definition | Fields match active JSON; loading/failure state is clear | Implemented |
| U02 | Select Equipment; enter monitor/quantity; then select Software | Correct panel visible each time; inactive values not persisted | Implemented |
| U03 | Submit empty form and out-of-range numbers | Relevant client errors; final write rejected; API also rejects bypassed invalid payload | Implemented |
| U04 | Save incomplete draft; navigate away and reopen | Same record, values, version and Draft status | Implemented |
| U05 | Submit complete draft twice or retry stale revision | First succeeds; later edit rejected; no duplicate record | Implemented (no workflow dispatch) |
| U06 | Alex creates request; Sam tries to read/update; Morgan views | Sam cannot access; Morgan reads but cannot write | Implemented under mock identity |
| U07 | Open seeded In review / Approved requests | Correct owner, saved data, status and history; no editing | Implemented; status seeded |
| U08 | Inject next-save failure, then retry | Error shown, input preserved, success only after API acknowledgement | Implemented |
| U09 | Switch EN/VI with partially entered data | Translated labels/options and preserved values | Implemented; some technical messages remain English |
| U10 | Select invalid/oversized files, then valid metadata | Reject outside policy; valid metadata survives save/reload; clearly marked simulation | Metadata only |
| U11 | Activate v2; create new request; open saved v1 request | New optional field on v2; historical request uses v1; no frontend rebuild | Implemented |
| U12 | Keyboard through inputs/actions, trigger validation, narrow screen | Visible focus, usable order, errors announced, no page overflow | Basic implementation; customer accessibility verification required |
| U13 | Two sessions edit one draft; save both | Second save gets conflict; reload avoids silent overwrite | API logic implemented |
| U14 | Upload/scan/download a real file as another user | Quarantine until approved; authorized download only; retention respected | Pending product integration |
| U15 | Submit with real identity; existing workflow approves | Single workflow start, status updates and auditable transition | Pending product integration |
| U16 | Change form policy, roll back active version | New requests use rollback version; existing records remain readable | Version pointer modeled; controlled publishing pending |

Evidence per run: scenario ID, build/version, role/account, input, expected/actual result, screenshot or request/response reference, defect ID, tester and date. Never include real sensitive data in evidence.

## Defects and exit criteria

- **Critical:** unauthorized data access, data loss, or total submission failure. Block acceptance and release.
- **High:** core scenario fails without an acceptable workaround. Fix and rerun affected scenarios plus permission/save regression.
- **Medium/low:** limited usability, translation or cosmetic issue. Business owner may accept with a written owner, due date and workaround.

Exit: all agreed critical business journeys pass, no open critical/high defects, lower-severity issues explicitly accepted, support/runbook and rollback reviewed, and the business UAT owner signs the exact build/scope. Technical readiness and business acceptance are separate decisions.

Triage daily during UAT: reproduce -> distinguish defect from scope change -> assign owner/severity -> fix -> QA retest -> business user confirms. Scope changes go through impact/estimate review. Do not label an unimplemented scope item as a passing test.

## Acceptance record (to complete with customer)

Build/version: pending. Approved scope: pending. Executed scenarios/evidence: pending. Open accepted issues with owners/dates: pending. Rollback/contact owner: pending. Business sign-off name/date: pending. Technical release approval name/date: pending.
