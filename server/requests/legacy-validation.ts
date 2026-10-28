import {
  validationMessages,
  validationMessage,
} from "../../shared/i18n/validation";
import { apiMessages } from "../../shared/i18n/api-en";
import { z } from "zod";
import type { RequestData } from "../../shared/model";
import type { PublishedForm } from "../../shared/forms";
import { ApiError } from "../http/errors";
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
export function legacyCandidate(
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
  return Object.fromEntries(
    Object.entries(source).filter(([key]) =>
      Object.hasOwn(dataSchema.shape, key),
    ),
  );
}
export function normalizeData(
  raw: Record<string, unknown>,
  profile: PublishedForm["validationProfile"],
): RequestData {
  const source = legacyCandidate(raw, profile);
  const validated = dataSchema.safeParse(source);
  if (!validated.success) {
    const fields = Object.fromEntries(
      validated.error.issues.map((i) => [String(i.path[0]), i.message]),
    );
    throw new ApiError(
      422,
      "INVALID",
      apiMessages.pleaseCheckTheHighlightedValues,
      fields,
    );
  }
  return validated.data;
}

export function validateSubmission(data: RequestData) {
  const fields: Record<string, string> = {};
  if (!data.requestTitle || data.requestTitle.length < 3)
    fields.requestTitle = validationMessage("characters", 3);
  if (!data.requestType) fields.requestType = validationMessages.requestType;
  if (!data.reason || data.reason.length < 10)
    fields.reason = validationMessage("characters", 10);
  if (data.requestType === "equipment") {
    if (!data.equipment) fields.equipment = validationMessages.equipment;
    if (!data.quantity) fields.quantity = validationMessages.quantity;
  }
  if (data.requestType === "software") {
    if (!data.application) fields.application = validationMessages.application;
    if (!data.accessDays) fields.accessDays = validationMessages.accessDays;
  }
  if (Object.keys(fields).length)
    throw new ApiError(
      422,
      "INVALID",
      apiMessages.completeTheRequiredFieldsBeforeSubmitting,
      fields,
    );
}
