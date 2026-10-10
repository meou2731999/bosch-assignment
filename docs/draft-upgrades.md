# Draft upgrades and snapshots (step 6)

A saved request draft stays on its current published form version until its owner explicitly previews and confirms an upgrade. Publication never changes a request automatically. Submitted, in-review, approved and rejected requests retain their pinned version/data and cannot upgrade or restore. This stage applies to request drafts; published form definitions remain immutable.

## Requester workflow

1. Save any local changes or pending attachments. Upgrade/restore controls are disabled while there is unsaved input or an upload/save in progress.
2. Open **Draft versions and snapshots**. **Refresh versions** discovers a newly published version without reloading the browser document and retries a failed history load.
3. Choose **Preview upgrade** to move to the latest published version, or select a saved revision and choose **Preview restore**.
4. Review added/removed/changed schema paths, validators/options/visibility/order, before/after data values, attachments and fields still required for submission. **Form after change** allows editing the upgrade candidate with the target schema; restore candidates are read-only. Preview/cancel does not write anything.
5. Correct every invalid value and missing required field, then choose **Validate preview changes**. Confirmation stays blocked until target-schema validation passes. Check the explicit agreement and choose **Apply confirmed change**. The API recalculates the preview, verifies its fingerprint and revision, then atomically saves a new draft revision, snapshot and audit event. The UI switches schema/data together in the same browser document.

Upgrade policy: retain invalid values for correction in the preview and block upgrading until all visible values and required fields validate against the target schema. Removed, hidden and unknown fields are excluded and listed for review. There is no implicit rename mapping, type coercion, truncation of invalid collections, or fabricated default. Editing and validating the candidate does not save the original draft. The server validates every confirmation independently. Legacy IT templates retain their existing validation profile.

Restore policy: return the selected snapshot's exact data, attachments and historical form version; increase the current request revision rather than roll back revision/audit. Restore may move to an older published version. Its preview includes reintroduced values and the before/after file list. It requires the historical schema and uploaded file metadata/bytes to be available. A missing snapshot/schema/file fails without changing the current record or history. Legacy metadata-only files remain metadata-only; restore cannot manufacture their missing bytes.

## API and authorization

Only the draft owner with current `create` permission for its form can access history or apply transitions. Admin/view/review grants do not permit another user's history access or draft changes. Session/CSRF protection is unchanged. Unauthorized/missing drafts return 404; non-draft records return 409 `LOCKED`.

- `GET /api/requests/:id/snapshots`: metadata `{revision,formVersion,at,actorId}` for saved snapshots. Ordinary request reads/lists omit internal snapshot bodies, including for admins/reviewers.
- `POST /api/requests/:id/upgrade/preview`: `{revision,targetVersion,data?}`; the target must be newer and currently active for the same form.
- `POST /api/requests/:id/upgrade`: `{revision,targetVersion,data,confirm:true,token}`.
- `POST /api/requests/:id/restore/preview`: `{revision,snapshotRevision}`.
- `POST /api/requests/:id/restore`: `{revision,snapshotRevision,confirm:true,token}`.

Preview returns operation/request/revision/version identifiers, target published schema, schema/data diffs, candidate data/files, submission errors and a SHA-256 fingerprint. Upgrade preview/confirmation accepts edited candidate data, which the server projects and validates against its immutable target definition. Schema or attachment replacements are rejected. The fingerprint binds the validated candidate and stored request state. Invalid or incomplete upgrade candidates return 422 without a write. The fingerprint detects changed preview contents; owner/session/permission checks provide authorization. It is not an expiring credential.

A save, submit, upgrade or restore that changes the request revision invalidates an earlier preview. A newer active publication invalidates an upgrade to the previous active version. Confirmation retries after a successful write return a conflict rather than creating duplicate transitions. The UI discards the stale preview, retains the current displayed draft, and offers explicit **Reload request**; it does not silently merge or overwrite. Ordinary PUT saves still cannot change the form type/current pinned version; only these confirmed transitions can change a draft's version.

## Persistence and audit

Snapshots are stored internally with each record in `requests.json`. Each successful saved draft revision captures data, files, form version, time and actor. Old drafts without snapshots are left untouched on startup; their existing state is captured before their first mutation, including submission. Successful submission keeps existing draft snapshots internally but removes history/transition access. Each operation writes record, snapshots and audit with one atomic file replacement; failed writes leave in-memory and persisted state unchanged. Read methods return detached copies so callers cannot mutate historical state.

`draft_upgraded`/`draft_restored` audit entries include actor/time, old/new form version, restored snapshot revision where applicable, and paths/kinds of data changes. The Activity UI displays these details. Snapshot restore never deletes previous snapshots or rewrites audit. The local single-process JSON store retains all snapshots; compaction/retention policy and distributed storage remain outside this stage.

## Verification

`npm run check` verifies lint/formatting, 77 unit/API tests and the typecheck/production build. New tests cover nested and legacy migration, recursive diffs/order, fingerprints, preview immutability, explicit confirmation, permission revocation, admin/reviewer boundaries, published/submitted immutability, persistence/restart, exact restore, missing files/versions/snapshots, and failed atomic writes.

`npm run test:e2e:headed` runs 10 Chromium scenarios. Two new scenarios cover discovery without document reload, unsaved-input gating, candidate render, cancel/confirmation, correction of invalid and required fields before confirmation, snapshot restore including a removed attachment, submission pinning, publication/save conflicts and explicit reload recovery. Screenshots: `draft-upgrade-preview.png`, `draft-restored.png`, `draft-upgrade-conflict.png` under ignored `test-results/`.

Step 7 (CI and final release-wide evidence/handoff) remains pending.
