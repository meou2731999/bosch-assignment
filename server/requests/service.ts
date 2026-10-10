import { validateRequestData } from "./validate-data";
import {
  canAccessForm,
  hasFormPermission,
  type PublishedForm,
} from "../../shared/forms";
import { z } from "zod";
import type { RequestRecord, User } from "../../shared/model";

import { ApiError } from "../http/errors";
export { ApiError } from "../http/errors";

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

export function saveRequest(
  user: User,
  previous: RequestRecord | undefined,
  raw: unknown,
  id: string,
  now: string,
  form: Pick<
    PublishedForm,
    "formId" | "version" | "validationProfile" | "fields"
  >,
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

  const data = validateRequestData(form, input.data, input.action === "submit");
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
