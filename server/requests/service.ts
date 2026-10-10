import {
  canAccessForm,
  hasFormPermission,
  type PublishedForm,
} from "../../shared/forms";
import { z } from "zod";
import type { RequestData, RequestRecord, User } from "../../shared/model";

import { ApiError } from "../http/errors";
export { ApiError } from "../http/errors";

const dataSchema = z.object({
  requestTitle: z.string().trim().max(80).optional(),
  requestType: z.enum(["equipment", "software"]).optional(),
  reason: z.string().trim().max(500).optional(),
  equipment: z.enum(["laptop", "monitor", "headset"]).optional(),
  quantity: z.number().int().min(1).max(25).optional(),
  application: z.enum(["design", "analytics", "project"]).optional(),
  accessDays: z.number().int().min(1).max(365).optional(),
  additionalNotes: z.string().trim().max(500).optional(),
});
const saveSchema = z.object({
  revision: z.number().int().min(0),
  formId: z.string().min(1).max(80),
  formVersion: z.number().int().positive(),
  action: z.enum(["draft", "submit"]),
  data: z.record(z.string(), z.unknown()),
  attachments: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        size: z
          .number()
          .int()
          .min(1)
          .max(5 * 1024 * 1024),
        type: z.enum([
          "application/pdf",
          "image/png",
          "image/jpeg",
          "text/plain",
        ]),
      }),
    )
    .max(3),
});

export function canRead(user: User, record: RequestRecord) {
  return (
    Boolean(user.isAdmin) ||
    (canAccessForm(user, record.formId) &&
      (hasFormPermission(user, record.formId, "view") ||
        record.ownerId === user.id))
  );
}

function normalizeData(
  raw: Record<string, unknown>,
  profile: PublishedForm["validationProfile"],
): RequestData {
  // Explicit policy: inactive section values are discarded before validation/storage.
  const source = { ...raw };
  for (const key of Object.keys(source)) {
    if (source[key] === "" || source[key] === null) delete source[key];
  }
  if (source.requestType !== "equipment") {
    delete source.equipment;
    delete source.quantity;
  }
  if (source.requestType !== "software") {
    delete source.application;
    delete source.accessDays;
  }
  if (profile === "request-v1") delete source.additionalNotes;
  const validated = dataSchema.safeParse(source);
  if (!validated.success) {
    const fields = Object.fromEntries(
      validated.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    throw new ApiError(
      422,
      "INVALID",
      "Please check the highlighted values.",
      fields,
    );
  }
  return validated.data;
}

function validateSubmission(data: RequestData) {
  const fields: Record<string, string> = {};
  if (!data.requestTitle || data.requestTitle.length < 3)
    fields.requestTitle = "Enter at least 3 characters.";
  if (!data.requestType) fields.requestType = "Choose a request type.";
  if (!data.reason || data.reason.length < 10)
    fields.reason = "Enter at least 10 characters.";
  if (data.requestType === "equipment") {
    if (!data.equipment) fields.equipment = "Choose equipment.";
    if (!data.quantity) fields.quantity = "Enter a quantity from 1 to 25.";
  }
  if (data.requestType === "software") {
    if (!data.application) fields.application = "Choose an application.";
    if (!data.accessDays)
      fields.accessDays = "Enter access duration from 1 to 365 days.";
  }
  if (Object.keys(fields).length)
    throw new ApiError(
      422,
      "INVALID",
      "Complete the required fields before submitting.",
      fields,
    );
}

export function saveRequest(
  user: User,
  previous: RequestRecord | undefined,
  raw: unknown,
  id: string,
  now: string,
  form: Pick<PublishedForm, "formId" | "version" | "validationProfile">,
): RequestRecord {
  if (
    !hasFormPermission(user, form.formId, "create") ||
    (previous && previous.ownerId !== user.id)
  ) {
    throw new ApiError(403, "FORBIDDEN", "You cannot change this request.");
  }
  if (previous && previous.status !== "draft") {
    throw new ApiError(
      409,
      "LOCKED",
      "This request has already been submitted.",
    );
  }
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success)
    throw new ApiError(
      422,
      "INVALID",
      "Invalid request data or attachment metadata.",
    );
  const input = parsed.data;
  if (input.revision !== (previous?.revision ?? 0)) {
    throw new ApiError(
      409,
      "CONFLICT",
      "A newer revision exists. Reload the request before editing.",
    );
  }
  if (input.formId !== form.formId || input.formVersion !== form.version)
    throw new ApiError(
      409,
      "VERSION",
      "The selected form version is unavailable.",
    );
  if (
    previous &&
    (input.formId !== previous.formId ||
      input.formVersion !== previous.formVersion)
  ) {
    throw new ApiError(
      409,
      "VERSION",
      "A saved request must keep its original form version.",
    );
  }

  const data = normalizeData(input.data, form.validationProfile);
  if (input.action === "submit") validateSubmission(data);
  let auditAction: RequestRecord["audit"][number]["action"] = previous
    ? "draft_saved"
    : "created";
  if (input.action === "submit") auditAction = "submitted";
  return {
    id,
    ownerId: user.id,
    formId: input.formId,
    formVersion: input.formVersion,
    revision: (previous?.revision ?? 0) + 1,
    status: input.action === "submit" ? "submitted" : "draft",
    data,
    attachments: input.attachments,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    audit: [
      ...(previous?.audit ?? []),
      {
        at: now,
        actorId: user.id,
        action: auditAction,
      },
    ],
  };
}
