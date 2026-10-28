import { apiMessages } from "../../shared/i18n/api-en";
import { z } from "zod";
import { fieldsSchema } from "../../shared/fields";
import { importFormDefinition } from "../../shared/form-import";
import type { FormDraft } from "../../shared/forms";
import { ApiError } from "../http/errors";
const draftSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000),
    template: z.enum(["request-v1", "request-v2", "blank"]),
    fields: fieldsSchema.optional(),
    uploadedDefinition: z.unknown().optional(),
  })
  .strict()
  .refine(
    (draft) =>
      draft.template !== "blank" ||
      Boolean(draft.fields?.length) ||
      Boolean(draft.uploadedDefinition),
    {
      message: apiMessages.blankFormsRequireAtLeastOneField,
      path: ["fields"],
    },
  );
export function readFormDraft(raw: unknown): FormDraft {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success)
    throw new ApiError(422, "INVALID", apiMessages.invalidFormDraft);
  const { uploadedDefinition, ...draft } = parsed.data;
  if (uploadedDefinition !== undefined) {
    try {
      const imported = importFormDefinition(uploadedDefinition);
      return {
        ...draft,
        template: "blank",
        uploadedDefinition: imported.definition,
        fields: imported.fields,
      };
    } catch {
      throw new ApiError(
        422,
        "INVALID",
        apiMessages.invalidOrUnsupportedFormIoJson,
      );
    }
  }
  return draft;
}
