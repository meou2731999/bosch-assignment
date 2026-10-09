# Presentation and demonstration

## 30-minute solution presentation

1. **0-4 min: business problem.** Email/spreadsheet handoffs obscure required data, status and ownership. Start with one IT request process; measure completion and correction rates during pilot instead of claiming unmeasured savings.
2. **4-8 min: scope and assumptions.** Explain the two request types, requester/reviewer permissions, draft/final policy and attachment/workflow simulation boundaries.
3. **8-16 min: architecture and decisions.** Show JSON -> API -> React wrapper -> renderer, and API-owned validation/persistence. Explain why existing identity/database/workflow stay authoritative and where Form.io coupling remains.
4. **16-21 min: evolution and risks.** Version pinning, restricted publication, dependency updates, schema/server drift, large renderer bundle and file handling.
5. **21-27 min: delivery and team.** Four-week conditional pilot estimate, bounded junior tasks, small reviews, integration milestones and UAT ownership.
6. **27-30 min: acceptance and decision.** Summarize evidence, remaining integration gates and the customer decisions needed to start a pilot.

## 15-minute live demo

- **0-2:** Show synthetic identity, new form fetched from JSON, two conditional panels.
- **2-4:** Submit empty form; explain client feedback and independent API validation.
- **4-6:** Save draft, open another request, reload draft. Switch language.
- **6-8:** Fill relevant section, simulate one API failure, retry and show successful final submission + history.
- **8-10:** Sam cannot see Alex's request; Morgan can read all but cannot submit/edit. Open seeded approval states.
- **10-12:** Set active version to 2, click New request, show Additional notes; reopen v1. Restore active version 1.
- **12-14:** Show automated test output and one direct API negative case; identify metadata-only attachments and mock identity.
- **14-15:** Explain where real API/file/workflow adapters plug in and what UAT will decide.

Fallback: run `npm run build && npm start` before the panel, use a clean source extraction and keep the PDF available. If the API is unavailable during the demo, explain the error state without presenting a screenshot as live behavior.

## Questions to rehearse

- Why not build the form engine? Reusing the renderer lets this assignment focus on business rules, API integration and acceptance. A custom engine creates validation/condition/accessibility work with little pilot value.
- Why not use the full Form.io backend? The scenario already supplies product identity, entities, workflow and APIs. The renderer can work with our JSON and API; a second backend needs a separate business reason.
- Can the wrapper eliminate lock-in? No. It contains lifecycle/integration code, while the schema and rule behavior remain Form.io-specific. Replacement requires migration and regression tests.
- Can business users change everything without deployment? Supported presentation/configuration changes can avoid a frontend release. New stored fields and server business rules need a compatible backend contract and controlled publication.
- Is the prototype secure? It demonstrates server-side policy, but identity is intentionally spoofable and the store is local. It is not a production authentication boundary.
- What happens on a requirement change? Clarify the outcome, identify field/API/workflow/UAT impacts, estimate under explicit assumptions, and agree on scope/date trade-offs before committing.

Candidate preparation: personally run and inspect every demonstrated path; explain `DynamicForm`, `saveRequest`, version pinning and error recovery in your own words. Correct the AI disclosure to reflect only independent review that actually took place.
