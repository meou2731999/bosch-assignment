# Assumptions and decision log

Status: assessment decisions, 9 October 2026. Customer requirements beyond the assignment remain unconfirmed.

## Assumptions to validate in discovery

| ID | Assumption | Why it matters / validation owner |
| --- | --- | --- |
| A1 | One internal IT request process; two types: equipment and software access | Business owner confirms taxonomy and field rules |
| A2 | Requesters see only their requests; reviewers see all and cannot edit | Product/security owner confirms team/department/tenant boundaries |
| A3 | Drafts may be incomplete; submitted records are immutable to requesters | Process owner confirms withdrawal, correction and resubmission needs |
| A4 | Existing authentication, database and workflow can be reused | Backend lead confirms endpoints and sandbox access during discovery |
| A5 | English and Vietnamese suffice for the pilot | Business owner provides approved translations and locale requirements |
| A6 | Attachments are optional, at most three, 5 MB each, PDF/PNG/JPG/TXT | Security/storage owner confirms file policy, retention and scanning |
| A7 | A trusted author manages form configuration; requesters cannot upload schemas | Product owner names author, approver and release owner |
| A8 | Pilot UAT feedback can be triaged within two business days | Sponsor assigns named UAT owner and testers |
| A9 | No field-level restricted or regulated data is needed for the pilot | Security/business owner confirms classification before real data use |

## Decisions

| ID | Decision | Benefit | Cost / alternative / revisit trigger |
| --- | --- | --- | --- |
| D1 | Use `@formio/react` behind `DynamicForm` | Fast JSON rendering; reuse tested field behavior | Form.io schema/rule coupling remains. Direct JS integration offers lower-level control but extra lifecycle code; custom React fields cost more. Revisit only for a demonstrated unsupported requirement. |
| D2 | Use the existing product API as authority; mock with Express locally | No duplicate authentication/database/workflow platform | Backend must enforce business rules independently. Full Form.io server integration would add operational and product-edition choices. |
| D3 | Keep the Form.io schema, without a neutral schema conversion layer | Small, inspectable implementation | Later renderer replacement requires field/rule mapping. Wrapper alone does not remove dependency lock-in. |
| D4 | React local state + renderer ref; no global store | Clear ownership and little boilerplate | Revisit if multiple routes need unsaved shared state or complex cross-form workflows. |
| D5 | Pin each request to formVersion; use explicit revision checks | Old submissions remain readable; stale edits are rejected | No automatic migration or merge. User reloads after a conflict; only two demo versions are supported. |
| D6 | Discard inactive conditional data before persistence | Prevent stale answers affecting downstream work | Switching types and saving loses the previous section's values; explain this policy to users. |
| D7 | Treat schema fixtures as trusted code/configuration | Avoid arbitrary scripts/data URLs in untrusted form input | Real business-author publication needs an allowlist, preview, review and audit gate. These gates are proposed, not implemented. |
| D8 | Mock attachments by metadata; status visibility without approval actions | Meets the minimum prototype while illustrating the wider journey | Complete file upload and workflow integration remain pilot work, explicitly estimated. |
| D9 | Lock dependencies and verify upgrade compatibility | Reproducible builds and a visible maintenance policy | Security audit is incomplete evidence; regression, license and maintenance review remain required. |
| D10 | Single-process local JSON storage | Reproducible demonstration without infrastructure | No horizontal scaling, durable DB transactions, pagination or high-volume suitability. Replace with existing database for pilot. |

## Deliberate exclusions

No custom form builder, custom schema language, renderer migration, plugin marketplace, multitenancy implementation, microservices, queues, visual workflow editor or real SSO implementation. The proposal discusses how the existing product would provide required services; the prototype does not claim those integrations are completed.

## Customer decisions still needed for real delivery

Confirm the minimum field set; who may view/approve which request; draft retention and resubmission; attachment storage policy; ownership of translations and published forms; acceptance metrics and approver. These do not block the synthetic assessment prototype. They are discovery gates for customer implementation.
