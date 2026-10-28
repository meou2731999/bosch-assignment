# Request Desk

A local React/Express assessment for configurable forms, requests and review. It includes account administration, per-form permissions, blank/custom forms, attachments, pinned schema versions and confirmed draft upgrades/restores. Data is synthetic; the standalone platform roadmap is not implemented.

## Run

Use Node 24 and npm. No database, Docker or hosted Form.io account is required.

```sh
npm ci --include=dev
# Supply ADMIN_EMAIL and ADMIN_PASSWORD through the environment.
npm run bootstrap:admin
npm run dev
```

Open **http://127.0.0.1:5173**; the API uses port **3001**. `.env.example` lists settings, but `.env` is not loaded automatically. Use the same `DATA_DIR` for bootstrap and server (default `.data`). Bootstrap refuses to replace an existing active administrator. For a built app, run `npm run build` then `npm start`; stop the development API first.

New accounts must change their initial password and sign in again. Admins manage users/forms and can read requests, but create/review actions still need explicit per-form grants.

## Try it

1. Admin opens **Manage forms → Create form type → Upload Form.io JSON**, selects a JSON file, reviews the preview, saves and publishes it. Alternatively, build a blank form with the field editor.
2. Grant **Create requests** to a requester and **Review requests** to a separate reviewer.
3. Requester fills the form, uploads an optional file, saves a draft and reopens it.
4. Publish a newer form. New requests use it; existing drafts keep their version until an explicit, validated upgrade.
5. Submit the request. Reviewer approves or rejects with a reason; final decisions remain locked.

## Upload a form

Use **Download example JSON** beside the upload field to get an editable sample. Upload a `.json` file up to 256 KB containing a title and a Form.io `components` array:

```json
{
  "title": "Visitor registration",
  "components": [
    {
      "type": "textfield",
      "key": "visitorName",
      "label": "Visitor name",
      "input": true,
      "validate": { "required": true }
    }
  ]
}
```

Supported components are `textfield` (text/date), `textarea`, `email`, `number`, `checkbox`, `select`, `radio`, `panel`, and `fieldset`. Static choices, required/bounds validation, and simple `conditional` rules are supported. Unsupported properties/components, executable rules, and remote data sources are rejected. This is a supported subset, not a general Form.io export importer.

Upload replaces the editor content only after validation succeeds. Save persists the uploaded definition; publish creates an immutable version. After upload, fields are editable with the same builder used for blank forms: add, remove, reorder, change types and validation, or preview before saving. You can also upload a replacement file. Until the first field edit, the original Form.io layout is preserved. Once edited, the builder layout is used (panels flatten into fields and radios become selects), retaining validation and visibility rules. Rendering and server validation use the stored definition and derived field rules, without reading a source template. Existing IT templates remain available for legacy forms.

## Documentation

- [Architecture](docs/architecture.md): code map, decisions, authentication, permissions, schema and request contracts.
- [Operation and verification](docs/handoff.md): tests, evidence, backup/recovery and acceptance gates.
- [Platform roadmap](docs/platform-roadmap.md): planned G0–G9 work and estimation boundaries.
- [Proposal](docs/proposal.md) / [PDF](docs/solution-proposal.pdf): concise solution and delivery narrative.
- [Presentation script](docs/presentation-notes.vi.md) / [PowerPoint](output/presentation/Request-Desk-Solution-Presentation-v4.pptx): English slides, Vietnamese narration, demo and Q&A.

Run `npm run check` for lint, formatting, unit/API tests and build. Run `npx playwright install chromium` then `npm run test:e2e` for isolated browser tests. Current results and limitations live only in the operation guide.

The local JSON/file store and process-local sessions are demonstration infrastructure. Production identity, tenants, database, scanning and reliable workflow delivery belong to the roadmap. Codex assisted code, tests and documentation; independent candidate review and customer acceptance are not recorded. Changes to documentation do not authorize implementation of roadmap stages.
