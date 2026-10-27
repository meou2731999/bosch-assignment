# Form store and per-form permissions (steps 3–6)

The API stores form types, authoring drafts, published JSON definitions and audit events in `.data/forms.json`. This remains a single-process local JSON store with atomic file replacement. Draft saves and publication require the current draft revision; publishing creates a new immutable version and advances the active pointer. Returned objects are detached from store state.

## Admin workflow

1. Sign in as admin and open **Manage forms**.
2. Create a type with a name, description and starting template, then save its draft. For custom fields, enable **Use custom fields**, add/configure fields and preview before saving.
3. Publish the saved draft. Draft-only types do not appear in the requester catalog.
4. Open **Manage users** → **Form permissions** for the desired user.
5. Check Create requests, View all requests and/or Review requests for each type, then save.

New accounts, including new admins, receive no create/view/review grants. Admin status allows managing all users/form types and reading all requests and published schemas. It does not imply creating requests or making review decisions. Role labels remain for display and legacy migration; grants now determine access.

- **create**: create/edit your own draft requests, upload files, and read your own requests for that form.
- **view**: read all requests and linked attachments for that form; no editing or review.
- **review**: includes view access and permits approval/rejection of submitted/in-review requests belonging to other users. Self-review is rejected even with the grant.
- Removing all grants hides the form and the user's own records for that form, unless they are an admin with read access.

The backend enforces these rules for catalogs, versioned schemas, request listing/get/save, decisions, uploads and attachment content. Unlinked pending files can only be previewed by the uploading owner with create permission. Linked files use request read access. Pending uploads are bound to both request ID and form ID; the API rejects reuse across forms. Client-side controls follow the same permission helpers.

Permission replacement uses a separate `permissionRevision` to reject stale writes, checks referenced form IDs and supported unique grant names, records actor/time/grant snapshots, and increments the user's credential version. Existing sessions become invalid immediately; the user signs in again with updated grants. Admins must explicitly grant themselves create/review if needed. New admin accounts also need to change initial passwords as usual.

## API contracts

- `GET /api/forms`: published types visible to the actor, with id/name/description/activeVersion and effective permissions.
- `GET /api/forms/:id`: active published definition, including formId/version/name/description/definition/validationProfile/publication metadata.
- `GET /api/forms/:id/versions/:version`: the immutable historical definition, with the same access policy.
- Admin-only `GET /api/admin/forms` and `GET /api/admin/forms/:id`: include draft, versions and audit.
- Admin-only `POST /api/admin/forms`: `{revision:0,name,description,template,fields?}`.
- Admin-only `PUT /api/admin/forms/:id/draft`: `{revision,name,description,template,fields?}`.
- Admin-only `POST /api/admin/forms/:id/publish`: `{revision}`. Publication increments the draft revision as well as creating a version.
- Admin-only `PUT /api/admin/users/:id/form-permissions`: `{revision,formPermissions:{[formId]:["create","view","review"]}}`; replaces all grants, returns the updated public account.

Request save payloads now require `formId` and a positive integer `formVersion`. New requests must match the active published version; ordinary saves of existing drafts must keep their current type and pinned version. Explicit draft upgrade/restore endpoints are documented in [draft upgrades](draft-upgrades.md). Metadata changes become visible to new requests without rebuilding the frontend; saved requests continue to load their pinned version. New-request UI selects among types with create permission.

Binary uploads require `X-Form-Id` when the request has not been saved. Saved requests derive their form ID from the record; a conflicting supplied header is rejected. Download URLs are unchanged.

## One-time migration and compatibility

On first initialization, the form store imports both `forms/request.v1.json` and `forms/request.v2.json` under type `request`, retaining their version numbers and the initial pointer from `forms/active.json`. Once `.data/forms.json` exists, changing active.json does not change the runtime pointer; publish through the admin workflow instead.

Existing request records without `formId` are assigned `request`; their owner, status, version, revision, data, attachments and audit are unchanged. The pre-migration requests are backed up to `.data/requests.pre-form-id.json`. Startup after migration is idempotent. Existing uploads without form metadata are interpreted as belonging to `request`, preserving their bytes and attachment IDs.

Existing accounts lacking per-form permissions are migrated once from their old role: requester → create on `request`; reviewer → view/review on `request`. Credentials, active flags and existing IDs are retained. Empty grant maps are intentional revocations and remain empty after restart. Accounts created after this step start with no grants.

## Step boundary and verification

Step 4 adds flat custom fields to drafts and publishes both their configuration and generated Form.io JSON. Supported inputs: text, textarea, email, number, checkbox, date (YYYY-MM-DD), and single select. Input and data types must be compatible: number → number, checkbox → boolean, all others → string. Changing the type in the editor resets incompatible validation settings. Required, min/max length, numeric min/max, integer-only and configured select options are supported. Dates must exist in the calendar and email addresses must be valid. Required checkboxes must be checked on submission.

The optional `fields` array contains `{key,label,input,dataType,required,minLength?,maxLength?,min?,max?,integer?,options?:[{label,value}]}`. Field keys must be unique identifiers (1–64 characters), excluding prototype keys. The API accepts 1–50 fields and up to 100 options per select. Empty custom schemas, duplicate option values, incompatible validators, reversed bounds and arbitrary/executable properties are rejected. Custom fields replace the starting template for that draft; they do not edit legacy conditional sections. Omitting fields selects the legacy template mode.

The frontend and API share `validateFields`. Drafts may omit required values, but supplied values must satisfy their configured type and validation. Submission requires all required fields; unknown payload properties are discarded. Empty string/null values are treated as absent. Strings are preserved, with whitespace-only required strings rejected at submission. The API uses the published field configuration, never fields supplied by a requester. Legacy published schemas without fields continue to use their existing template validation profile. Published snapshots and existing request data are unchanged.

Advanced fields and custom conditional visibility are documented below in step 5; user-confirmed upgrades of old drafts are documented in [step 6](draft-upgrades.md). Publishing never migrates existing requests.

`npm run check` runs lint, formatting, unit/API tests and build. `npm run test:e2e` covers the existing account flows plus form creation/publication, scoped grants, catalog visibility, draft save, old-version preservation and permission revocation using Chromium and temporary data. Tests cover authorization by form, role-independent grants, admin read boundaries, self-review rejection, unlinked/linked attachments, schema access, stale revisions, persistence and migration backups.


The field-builder Chromium scenario creates, edits, reorders, removes and previews fields, publishes v1, saves a request, then changes validation and adds an email field in v2. The requester loads v2 in the same browser document (a DOM marker proves there was no reload), validates and submits, then reopens and submits the v1 draft. This demonstrates form changes without a new frontend release. `test-results/field-editor-preview.png` captures the editor/preview. Unit/API tests additionally cover all basic data types, malformed/unsafe schemas, direct API validation bypass attempts, JSON restart persistence and immutable historical versions.

## Step 5: structured fields and visibility

Custom fields now additionally support `multiselect` (array of unique configured strings), `object` (nested key/value object), `repeat` (array of objects rendered as groups) and `table` (array of objects rendered as table rows). Container fields require a non-empty `fields` array; keys are unique within each sibling scope. Required objects must be present and their visible children must validate. Required collections must contain at least one item on submit. `minLength`/`maxLength` constrain collection size as well as string length; collections default to a maximum of 100 items and cannot configure a greater maximum. Drafts may omit required fields but supplied collections still respect configured bounds. Unknown properties are removed recursively. Errors identify paths such as `details.people.0.note`.

A field's optional `visibility` is a declarative expression:

```json
{
  "op": "and",
  "conditions": [
    { "op": "eq", "scope": "row", "key": "needs", "value": true },
    { "op": "eq", "scope": "parent", "key": "enabled", "value": true },
    {
      "op": "or",
      "conditions": [
        { "op": "contains", "scope": "root", "key": "tags", "value": "urgent" },
        { "op": "eq", "scope": "root", "key": "requestTitle", "value": "Override" }
      ]
    }
  ]
}
```

`and`/`or` require non-empty child expressions. Leaves support strict typed `eq`, `neq`, and array membership `contains`. `row` means the current containing object or repeated/table row; `parent` means the immediate containing object outside that row/object; `root` means the request data. At top level all three scopes refer to root. References use direct keys, never executable code or dotted paths. Conditions evaluate against the current input snapshot before validation; hidden fields and entire hidden containers are omitted from the saved payload and skip required/type checks. Locally hidden input is retained while editing, so toggling a condition restores it; saving removes hidden values. Conditions depending on hidden fields can therefore change after save/reload because those input values are absent.

The admin editor recursively adds/edits/removes/reorders children, configures typed leaf conditions and nested AND/OR groups, and previews the same renderer as requests. Switching operators within a group preserves children. The persisted `fields` configuration remains authoritative for custom validation/visibility. Publication also generates nested Form.io component JSON (`container`, `editgrid`, `datagrid`, multi-select); this JSON alone does not implement custom scoped visibility. The adapter uses a React renderer for custom schemas containing structured fields or visibility, sharing `isVisible` and `validateFields` with the API. Flat basic schemas and legacy templates retain their existing Form.io rendering path. This avoids evaluating author-provided JavaScript and does not change previously published definitions, request data or pinned versions.

Recursive parsing is bounded before descent: field JSON permits at most 24 structural levels / 6000 visited values, condition JSON at most 16 levels / 1000 visited values, with up to 50 fields per sibling list and 20 children per condition group. Unsafe keys, malformed nested types, unsupported properties and excessive bounds/depth are rejected before publication. Draft upgrades, migration confirmation and restore are documented separately in [step 6](draft-upgrades.md).

## Blank forms

Choose **Blank form** under **Starting template** to build a form without IT request fields. The builder starts empty; add at least one valid field before saving. Preview the configured fields, save the draft and publish it through the usual Actions menu.

Blank drafts use `template: "blank"` and require a non-empty `fields` array in the API. Published requests validate against those fields only, including their required flags, bounds and visibility conditions. They do not require IT-specific fields such as request type or reason. Existing IT templates and published versions keep their existing behavior.
