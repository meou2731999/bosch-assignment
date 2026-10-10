import { z } from "zod";
import type { BasicField } from "./fields";
export function validateFields(
  fields: BasicField[],
  raw: Record<string, unknown>,
  submit: boolean,
) {
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = Object.hasOwn(raw, field.key) ? raw[field.key] : undefined;
    if (value === undefined || value === null || value === "") {
      if (submit && field.required)
        errors[field.key] = "This field is required.";
      continue;
    }
    const error = validateValue(field, value, submit);
    if (error) errors[field.key] = error;
    else data[field.key] = value;
  }
  return { data, errors };
}
function validateValue(
  field: BasicField,
  value: unknown,
  submit: boolean,
): string | undefined {
  if (typeof value !== field.dataType) return `Expected ${field.dataType}.`;
  if (typeof value === "number") return validateNumber(field, value);
  if (typeof value === "boolean") return validateBoolean(field, value, submit);
  if (typeof value === "string") return validateString(field, value, submit);
  return undefined;
}

function validateNumber(field: BasicField, value: number): string | undefined {
  if (!Number.isFinite(value)) return "Enter a finite number.";
  if (field.integer && !Number.isInteger(value)) return "Enter a whole number.";
  if (field.min !== undefined && value < field.min)
    return `Minimum: ${field.min}.`;
  if (field.max !== undefined && value > field.max)
    return `Maximum: ${field.max}.`;
  return undefined;
}

function validateBoolean(
  field: BasicField,
  value: boolean,
  submit: boolean,
): string | undefined {
  if (submit && field.required && !value)
    return "This checkbox must be checked.";
  return undefined;
}

function validateString(
  field: BasicField,
  value: string,
  submit: boolean,
): string | undefined {
  if (submit && field.required && !value.trim())
    return "This field is required.";
  if (value.length < (field.minLength ?? 0))
    return `Minimum length: ${field.minLength}.`;
  if (value.length > (field.maxLength ?? 10000))
    return `Maximum length: ${field.maxLength ?? 10000}.`;
  return validateStringFormat(field, value);
}

function validateStringFormat(
  field: BasicField,
  value: string,
): string | undefined {
  if (field.input === "email" && !z.email().safeParse(value).success)
    return "Enter a valid email address.";
  if (
    field.input === "date" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !validDate(value))
  )
    return "Enter a valid date (YYYY-MM-DD).";
  if (
    field.input === "select" &&
    !field.options?.some((option) => option.value === value)
  )
    return "Choose a configured option.";
  return undefined;
}

function validDate(value: string) {
  const date = new Date(value + "T00:00:00.000Z");
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
