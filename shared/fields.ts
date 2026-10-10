import { withinBudget } from "./schema-budget";
import { z } from "zod";
import { conditionSchema, type Condition } from "./field-conditions";
export interface BasicField {
  key: string;
  label: string;
  input:
    | "text"
    | "textarea"
    | "email"
    | "number"
    | "checkbox"
    | "date"
    | "select"
    | "multiselect"
    | "object"
    | "repeat"
    | "table";
  dataType: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  options?: { label: string; value: string }[];
  fields?: BasicField[];
  visibility?: Condition;
}
const reserved = new Set(["__proto__", "prototype", "constructor"]);
export const fieldSchema: z.ZodType<BasicField> = z
  .object({
    key: z
      .string()
      .regex(/^[a-zA-Z]\w{0,63}$/)
      .refine((key) => !reserved.has(key)),
    label: z.string().trim().min(1).max(120),
    input: z.enum([
      "text",
      "textarea",
      "email",
      "number",
      "checkbox",
      "date",
      "select",
      "multiselect",
      "object",
      "repeat",
      "table",
    ]),
    dataType: z.enum(["string", "number", "boolean", "object", "array"]),
    required: z.boolean(),
    fields: z.lazy(() => fieldsSchema).optional(),
    visibility: conditionSchema.optional(),
    minLength: z.number().int().min(0).max(10000).optional(),
    maxLength: z.number().int().min(1).max(10000).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
    options: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(120),
            value: z.string().min(1).max(120),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict()
  .superRefine((field, ctx) => {
    const expected = inputDataType(field.input);
    const invalid =
      field.dataType !== expected ||
      (field.dataType === "array" && (field.maxLength ?? 100) > 100) ||
      (field.dataType === "array" &&
        (field.minLength ?? 0) > (field.maxLength ?? 100)) ||
      ["object", "repeat", "table"].includes(field.input) !==
        Boolean(field.fields) ||
      (field.minLength !== undefined &&
        field.maxLength !== undefined &&
        field.minLength > field.maxLength) ||
      (field.min !== undefined &&
        field.max !== undefined &&
        field.min > field.max) ||
      (field.dataType !== "number" &&
        (field.min !== undefined ||
          field.max !== undefined ||
          field.integer !== undefined)) ||
      (!["string", "array"].includes(field.dataType) &&
        (field.minLength !== undefined || field.maxLength !== undefined)) ||
      (!["select", "multiselect"].includes(field.input) &&
        field.options !== undefined) ||
      (["select", "multiselect"].includes(field.input) &&
        (!field.options?.length ||
          new Set(field.options.map((option) => option.value)).size !==
            field.options.length));
    if (invalid)
      ctx.addIssue({
        code: "custom",
        message: "Incompatible field type, bounds or options.",
      });
  });
export const fieldsSchema: z.ZodType<BasicField[]> = z.preprocess(
  (value, ctx) => {
    if (!withinBudget(value, 24, 6000)) {
      ctx.addIssue({
        code: "custom",
        message: "Schema is too deeply nested or too large.",
      });
      return z.NEVER;
    }
    return value;
  },
  z
    .array(fieldSchema)
    .min(1)
    .max(50)
    .refine(
      (fields) =>
        new Set(fields.map((field) => field.key)).size === fields.length,
      "Field keys must be unique.",
    ),
);

export function inputDataType(input: string) {
  if (input === "object") return "object";
  if (["multiselect", "repeat", "table"].includes(input)) return "array";
  if (input === "number") return "number";
  if (input === "checkbox") return "boolean";
  return "string";
}
export function inputForType(type: BasicField["dataType"]) {
  return (
    {
      string: "text",
      number: "number",
      boolean: "checkbox",
      object: "object",
      array: "repeat",
    } as const
  )[type];
}
