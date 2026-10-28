import { apiMessages } from "../../shared/i18n/api-en";
import { createHash } from "node:crypto";
import type { PublishedForm } from "../../shared/forms";
import type { RequestRecord } from "../../shared/model";
import type { DraftPreview, RequestSnapshot } from "../../shared/draft-history";
import { migrationCandidate, dataDiff } from "./migrate-data";
import { schemaDiff } from "./schema-diff";
import { validateRequestData } from "./validate-data";
import { ApiError } from "../http/errors";
export function draftPreview(
  record: RequestRecord,
  before: PublishedForm,
  target: PublishedForm,
  snapshot?: RequestSnapshot,
  edited?: Record<string, unknown>,
): DraftPreview {
  let candidate = migrationCandidate(
    target,
    snapshot?.data ?? edited ?? record.data,
  );
  candidate.dataChanges = dataDiff(record.data, candidate.data);
  if (snapshot) {
    // Restore is exact; it never migrates a historical payload or changes files silently.
    validateRequestData(target, snapshot.data, false);
    candidate = {
      ...candidate,
      data: structuredClone(snapshot.data),
      dataChanges: dataDiff(record.data, snapshot.data),
    };
  }
  const preview = {
    requestId: record.id,
    revision: record.revision,
    fromVersion: record.formVersion,
    toVersion: target.version,
    operation: snapshot ? ("restore" as const) : ("upgrade" as const),
    ...(snapshot ? { snapshotRevision: snapshot.revision } : {}),
    target: structuredClone(target),
    schemaChanges: schemaDiff(before, target),
    ...candidate,
    attachments: structuredClone(snapshot?.attachments ?? record.attachments),
  };
  const token = createHash("sha256")
    .update(JSON.stringify(preview))
    .digest("hex");
  return { ...preview, token };
}
export function applyPreview(
  record: RequestRecord,
  preview: DraftPreview,
  actorId: string,
  token: string,
  now: string,
): RequestRecord {
  if (token !== preview.token)
    throw new ApiError(
      409,
      "CONFLICT",
      apiMessages.thePreviewHasChangedReloadAndPreviewAgain,
    );
  if (
    preview.operation === "upgrade" &&
    Object.keys(preview.submissionErrors).length
  )
    throw new ApiError(
      422,
      "INVALID",
      apiMessages.correctAllValuesAndRequiredFieldsInTheMigration,
      preview.submissionErrors,
    );
  return {
    ...record,
    formVersion: preview.toVersion,
    revision: record.revision + 1,
    data: structuredClone(preview.data),
    attachments: structuredClone(preview.attachments),
    updatedAt: now,
    audit: [
      ...record.audit,
      {
        action:
          preview.operation === "upgrade" ? "draft_upgraded" : "draft_restored",
        at: now,
        actorId,
        fromVersion: preview.fromVersion,
        toVersion: preview.toVersion,
        snapshotRevision: preview.snapshotRevision,
        changes: preview.dataChanges.map(({ path, kind }) => ({ path, kind })),
      },
    ],
  };
}
