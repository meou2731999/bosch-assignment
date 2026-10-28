import { apiMessages } from "../../shared/i18n/api-en";
import { z } from "zod";
import type { Express } from "express";
import { hasFormPermission } from "../../shared/forms";
import type { RequestRecord, User } from "../../shared/model";
import type { RequestStore } from "../storage/requests";
import type { FormStore } from "../forms/store";
import type { AttachmentStore } from "../attachments/store";
import { ApiError } from "../http/errors";
import { draftPreview, applyPreview } from "./draft-preview";
const base = z.object({ revision: z.number().int().positive() });
const upgrade = base
  .extend({
    targetVersion: z.number().int().positive(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
const restore = base
  .extend({ snapshotRevision: z.number().int().positive() })
  .strict();
const confirm = {
  confirm: z.literal(true),
  token: z.string().regex(/^[a-f0-9]{64}$/),
};
function editable(
  record: RequestRecord | undefined,
  user: User,
): RequestRecord {
  if (
    !record ||
    record.ownerId !== user.id ||
    !hasFormPermission(user, record.formId, "create")
  )
    throw new ApiError(404, "NOT_FOUND", apiMessages.draftNotFound);
  if (record.status !== "draft")
    throw new ApiError(
      409,
      "LOCKED",
      apiMessages.thisRequestHasAlreadyBeenSubmitted,
    );
  return record;
}
function revision(record: RequestRecord, expected: number) {
  if (record.revision !== expected)
    throw new ApiError(
      409,
      "CONFLICT",
      apiMessages.aNewerRevisionExistsReloadTheRequestBeforeEditing,
    );
}
export function registerDraftRoutes(
  app: Express,
  store: RequestStore,
  forms: FormStore,
  files: AttachmentStore,
) {
  app.get("/api/requests/:id/snapshots", (req, res) => {
    const record = editable(store.get(req.params.id), res.locals.user);
    const items = store
      .snapshots(record.id)
      .map(({ data: _data, attachments: _files, ...summary }) => summary);
    res.json(items);
  });
  for (const operation of ["upgrade", "restore"] as const) {
    for (const previewOnly of [true, false]) {
      const schema = operation === "upgrade" ? upgrade : restore;
      const inputSchema = previewOnly
        ? schema
        : schema.extend(confirm).strict();
      const suffix = previewOnly ? "/preview" : "";
      app.post(`/api/requests/:id/${operation}${suffix}`, (req, res) => {
        const record = editable(store.get(req.params.id), res.locals.user);
        const parsed = inputSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ApiError(
            422,
            "INVALID",
            apiMessages.supplyRevisionTargetAndExplicitPreviewConfirmation,
          );
        const input = parsed.data;
        revision(record, input.revision);
        const snapshotRevision =
          "snapshotRevision" in input
            ? (input.snapshotRevision as number)
            : undefined;
        const snapshot =
          snapshotRevision === undefined
            ? undefined
            : store
                .snapshots(record.id)
                .find((item) => item.revision === snapshotRevision);
        if (operation === "restore" && !snapshot)
          throw new ApiError(404, "NOT_FOUND", apiMessages.snapshotNotFound);
        const target = forms.published(
          record.formId,
          snapshot?.formVersion ??
            (input as z.infer<typeof upgrade>).targetVersion,
        );
        if (
          operation === "upgrade" &&
          (target.version <= record.formVersion ||
            target.version !== forms.published(record.formId).version)
        )
          throw new ApiError(
            409,
            "VERSION",
            apiMessages.previewTheLatestPublishedVersionToUpgradeThisDraft,
          );
        const before = forms.published(record.formId, record.formVersion);
        const edited =
          "data" in input
            ? (input.data as Record<string, unknown> | undefined)
            : undefined;
        const preview = draftPreview(record, before, target, snapshot, edited);
        if (previewOnly) {
          res.json(preview);
          return;
        }
        const next = applyPreview(
          record,
          preview,
          res.locals.user.id,
          "token" in input && typeof input.token === "string"
            ? input.token
            : "",
          new Date().toISOString(),
        );
        next.attachments = files.resolve(
          res.locals.user,
          record.id,
          next.attachments,
          record.formId,
          snapshot ? { ...record, attachments: snapshot.attachments } : record,
        );
        // Resolve bytes before mutation, including files that have since been removed from storage.
        for (const attachment of next.attachments)
          if (attachment.id) files.read(files.get(attachment.id));
        store.put(next);
        res.json(next);
      });
    }
  }
}
