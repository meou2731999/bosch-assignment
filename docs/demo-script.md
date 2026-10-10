# Presentation and demonstration

Current implementation: 11 October 2026. Use synthetic accounts and an isolated `DATA_DIR`; never reset real records for a demo. Follow [handoff](handoff.md) for setup and recovery.

## 15-minute live demo

1. **0-2 min:** Login as admin; show accounts and per-form grants. Explain forced password changes, session/CSRF and server policy.
2. **2-4:** Create a custom form, configure a supported field and validation, preview, save and publish. Grant requester/reviewer access.
3. **4-6:** Requester fills the published schema, uploads a TXT file, saves/reopens a draft and switches EN/VI. Show validation and one simulated save failure with retry.
4. **6-9:** Publish a new supported field or tighter constraint. Click New request in the requester document and show the new schema. Reopen the old draft to show version pinning.
5. **9-11:** Preview upgrade, show invalid-value retention and blocked confirmation; correct/validate and apply. Preview/cancel or confirm a historical restore. Explain new revisions and unchanged snapshots.
6. **11-13:** Submit, inspect the file as reviewer, approve with a comment. Show read-only inputs, audit and retained schema after another publication.
7. **13-15:** Open the browser report's release-independent JSON evidence: identical bundle hashes, new field, v1 draft/v2 submission and approval. Explain local infrastructure and remaining customer UAT.

Fallback: run `npm run check` and `npm run test:e2e:headed` beforehand; keep their report and current PDF available. Present reports as recorded evidence if the API is unavailable, never as a live result. No manual `active.json` switch is needed after the form store exists.

## Questions to rehearse

- Why two rendering paths? Preserve legacy/basic Form.io behavior while supporting scoped structured fields through the shared declarative validator. The adapter keeps one save/read-only contract; replacement still requires mapping and regression tests.
- What changes without release? Supported labels, validators, field keys, nesting and conditions. New field kinds/operators, domain policy or integration need code. The evidence proves a bounded schema-only case.
- What protects old data? Immutable published versions, pinned requests, revision checks, strict upgrade preview/confirmation and exact snapshot restore. Submitted requests cannot migrate.
- Is authentication production-ready? It is real local session/password/CSRF behavior with negative tests; SSO, distributed sessions, operational controls and product integration remain work.
- Are files real? Bytes, preview/download and authorization are implemented. Malware scanning, quarantine and retention are not.
- Did CI pass remotely? The workflow is configured; this checkout has no GitHub remote/run evidence. Local checks are recorded separately.

Candidate preparation: personally inspect `DynamicForm`, shared validation, draft transition routes, snapshots and permission boundaries. Run the demo yourself and update AI disclosure only to reflect review that actually occurred.
