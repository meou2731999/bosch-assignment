import type { BasicField } from "../../shared/fields";
import type { PublishedForm } from "../../shared/forms";
import type { DataChange } from "../../shared/draft-history";
import { isVisible, type FieldScope } from "../../shared/field-conditions";
import { isObject } from "../../shared/field-values";
import { legacyCandidate } from "./legacy-validation";
import { validateRequestData } from "./validate-data";
import { ApiError } from "../http/errors";
function project(
  fields: BasicField[],
  raw: Record<string, unknown>,
  scope: FieldScope,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.hasOwn(raw, field.key) || !isVisible(field.visibility, scope))
      continue;
    const value = raw[field.key];
    if (field.input === "object" && isObject(value))
      data[field.key] = project(field.fields ?? [], value, {
        root: scope.root,
        row: value,
        parent: scope.row,
      });
    else if (field.fields && Array.isArray(value))
      data[field.key] = value.map((row) =>
        isObject(row)
          ? project(field.fields ?? [], row, {
              root: scope.root,
              row,
              parent: scope.row,
            })
          : row,
      );
    else data[field.key] = value; // Invalid supplied values stay visible for correction.
  }
  return data;
}
export function migrationCandidate(
  form: PublishedForm,
  raw: Record<string, unknown>,
) {
  let data = structuredClone(raw);
  if (form.fields) {
    let next = project(form.fields, data, {
      root: data,
      row: data,
      parent: data,
    });
    while (JSON.stringify(next) !== JSON.stringify(data)) {
      data = next;
      next = project(form.fields, data, {
        root: data,
        row: data,
        parent: data,
      });
    }
  } else data = legacyCandidate(data, form.validationProfile);
  let submissionErrors: Record<string, string> = {};
  try {
    data = validateRequestData(form, data, true);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    submissionErrors = error.fields;
  }
  return { data, dataChanges: dataDiff(raw, data), submissionErrors };
}
export function dataDiff(
  before: unknown,
  after: unknown,
  prefix = "",
): DataChange[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    (isObject(before) && isObject(after)) ||
    (Array.isArray(before) && Array.isArray(after))
  )
    return [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].flatMap((key) =>
      dataDiff(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        prefix ? `${prefix}.${key}` : key,
      ),
    );
  let kind: DataChange["kind"] = "changed";
  if (after === undefined) kind = "removed";
  else if (before === undefined) kind = "added";
  return [
    { path: prefix, before, ...(after === undefined ? {} : { after }), kind },
  ];
}
