import type { PublishedForm } from "../../shared/forms";
import { validateFields } from "../../shared/field-validation";
import { ApiError } from "../http/errors";
import { normalizeData, validateSubmission } from "./legacy-validation";
export function validateRequestData(
  form: Pick<PublishedForm, "fields" | "validationProfile">,
  raw: Record<string, unknown>,
  submit: boolean,
) {
  if (!form.fields) {
    const data = normalizeData(raw, form.validationProfile);
    if (submit) validateSubmission(data);
    return data;
  }
  const checked = validateFields(form.fields, raw, submit);
  if (Object.keys(checked.errors).length)
    throw new ApiError(
      422,
      "INVALID",
      "Please check the highlighted values.",
      checked.errors,
    );
  return checked.data;
}
