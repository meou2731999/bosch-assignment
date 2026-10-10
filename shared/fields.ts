import { z } from "zod";
const reserved = new Set(["__proto__", "prototype", "constructor"]);
export const fieldSchema = z
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
    ]),
    dataType: z.enum(["string", "number", "boolean"]),
    required: z.boolean(),
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
      (field.dataType !== "string" &&
        (field.minLength !== undefined || field.maxLength !== undefined)) ||
      (field.input !== "select" && field.options !== undefined) ||
      (field.input === "select" &&
        (!field.options?.length ||
          new Set(field.options.map((option) => option.value)).size !==
            field.options.length));
    if (invalid)
      ctx.addIssue({
        code: "custom",
        message: "Incompatible field type, bounds or options.",
      });
  });
export const fieldsSchema = z
  .array(fieldSchema)
  .min(1)
  .max(50)
  .refine(
    (fields) =>
      new Set(fields.map((field) => field.key)).size === fields.length,
    "Field keys must be unique.",
  );
export type BasicField = z.infer<typeof fieldSchema>;

export function inputDataType(input: string) {
  if (input === "number") return "number";
  if (input === "checkbox") return "boolean";
  return "string";
}
export function inputForType(type: BasicField["dataType"]) {
  return ({ string: "text", number: "number", boolean: "checkbox" } as const)[
    type
  ];
}
