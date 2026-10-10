# Form store and per-form permissions (step 3)

The API stores form types, authoring drafts, published JSON definitions and audit events in `.data/forms.json`. This remains a single-process local JSON store with atomic file replacement. Draft saves and publication require the current draft revision; publishing creates a new immutable version and advances the active pointer. Returned objects are detached from store state.

## Admin workflow

1. Sign in as admin and open **Manage forms**.
2. Create a type with a name, description and starting template, then save its draft.
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
- Admin-only `POST /api/admin/forms`: `{revision:0,name,description,template}`.
- Admin-only `PUT /api/admin/forms/:id/draft`: `{revision,name,description,template}`.
- Admin-only `POST /api/admin/forms/:id/publish`: `{revision}`. Publication increments the draft revision as well as creating a version.
- Admin-only `PUT /api/admin/users/:id/form-permissions`: `{revision,formPermissions:{[formId]:["create","view","review"]}}`; replaces all grants, returns the updated public account.

Request save payloads now require `formId` and a positive integer `formVersion`. New requests must match the active published version; existing drafts must keep their original type and version. Metadata changes become visible to new requests without rebuilding the frontend; saved requests continue to load their pinned version. New-request UI selects among types with create permission.

Binary uploads require `X-Form-Id` when the request has not been saved. Saved requests derive their form ID from the record; a conflicting supplied header is rejected. Download URLs are unchanged.

## One-time migration and compatibility

On first initialization, the form store imports both `forms/request.v1.json` and `forms/request.v2.json` under type `request`, retaining their version numbers and the initial pointer from `forms/active.json`. Once `.data/forms.json` exists, changing active.json does not change the runtime pointer; publish through the admin workflow instead.

Existing request records without `formId` are assigned `request`; their owner, status, version, revision, data, attachments and audit are unchanged. The pre-migration requests are backed up to `.data/requests.pre-form-id.json`. Startup after migration is idempotent. Existing uploads without form metadata are interpreted as belonging to `request`, preserving their bytes and attachment IDs.

Existing accounts lacking per-form permissions are migrated once from their old role: requester → create on `request`; reviewer → view/review on `request`. Credentials, active flags and existing IDs are retained. Empty grant maps are intentional revocations and remain empty after restart. Accounts created after this step start with no grants.

## Step boundary and verification

This step supports the two existing trusted IT templates (`request-v1`, `request-v2`) for published definitions. Validation follows the stored template profile, independent of a new form's version number. The API rejects arbitrary definition properties. Field authoring and schema-driven validation are step 4; advanced fields/conditions are step 5; user-confirmed upgrades of old drafts are step 6. Publishing here never migrates existing requests.

`npm run check` runs lint, formatting, unit/API tests and build. `npm run test:e2e` covers the existing account flows plus form creation/publication, scoped grants, catalog visibility, draft save, old-version preservation and permission revocation using Chromium and temporary data. Tests cover authorization by form, role-independent grants, admin read boundaries, self-review rejection, unlinked/linked attachments, schema access, stale revisions, persistence and migration backups.
