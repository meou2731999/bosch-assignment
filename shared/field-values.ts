import type { BasicField } from "./fields";
import type { FieldScope } from "./field-conditions";
import { validateFields } from "./field-validation";
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function validateComplex(
  field: BasicField,
  value: unknown,
  submit: boolean,
  scope: FieldScope,
  path: string,
) {
  const errors: Record<string, string> = {};
  if (field.input === "object") {
    if (!isObject(value)) return { errors: { [path]: "Expected object." } };
    const result = validateFields(
      field.fields ?? [],
      value,
      submit,
      { root: scope.root, row: value, parent: scope.row },
      path + ".",
    );
    return { value: result.data, errors: result.errors };
  }
  if (!Array.isArray(value)) return { errors: { [path]: "Expected array." } };
  const minimum = Math.max(
    field.minLength ?? 0,
    submit && field.required ? 1 : 0,
  );
  if (value.length < minimum || value.length > (field.maxLength ?? 100))
    errors[path] = `Expected ${minimum}–${field.maxLength ?? 100} items.`;
  if (field.input === "multiselect") {
    if (
      new Set(value).size !== value.length ||
      value.some(
        (item) =>
          typeof item !== "string" ||
          !field.options?.some((option) => option.value === item),
      )
    )
      errors[path] = "Choose unique configured options.";
    return { value, errors };
  }
  const rows = value.slice(0, 100).map((row, index) => {
    const rowPath = `${path}.${index}`;
    if (!isObject(row)) {
      errors[rowPath] = "Expected object.";
      return {};
    }
    const result = validateFields(
      field.fields ?? [],
      row,
      submit,
      { root: scope.root, row, parent: scope.row },
      rowPath + ".",
    );
    Object.assign(errors, result.errors);
    return result.data;
  });
  return { value: rows, errors };
}
