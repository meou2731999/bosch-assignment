import { z } from "zod";
import { fieldsSchema, inputDataType, type BasicField } from "./fields";
import type { Condition } from "./field-conditions";
import type { FormDefinition } from "./forms";
import { withinBudget } from "./schema-budget";

export const MAX_FORM_FILE_BYTES = 256 * 1024;
const options = z.array(
  z.object({ label: z.string(), value: z.string() }).strict(),
);
const componentSchema = z
  .object({
    type: z.enum([
      "textfield",
      "textarea",
      "email",
      "number",
      "checkbox",
      "select",
      "radio",
      "panel",
      "fieldset",
    ]),
    key: z
      .string()
      .regex(/^[a-zA-Z]\w{0,63}$/)
      .refine(
        (key) =>
          !["constructor", "prototype", "__proto__"].includes(key) &&
          !key.startsWith("tmp_"),
      ),
    label: z.string().max(120).optional(),
    title: z.string().max(120).optional(),
    input: z.boolean().optional(),
    inputType: z.enum(["text", "date"]).optional(),
    placeholder: z.string().optional(),
    description: z.string().optional(),
    tooltip: z.string().optional(),
    tableView: z.boolean().optional(),
    labelPosition: z.literal("top").optional(),
    hideLabel: z.boolean().optional(),
    rows: z.number().int().min(1).max(50).optional(),
    inline: z.boolean().optional(),
    collapsible: z.literal(false).optional(),
    clearOnHide: z.literal(true).optional(),
    widget: z.literal("html5").optional(),
    dataSrc: z.literal("values").optional(),
    data: z.object({ values: options }).strict().optional(),
    values: options.optional(),
    multiple: z.boolean().optional(),
    decimalLimit: z.number().int().min(0).max(15).optional(),
    requireDecimal: z.literal(false).optional(),
    validate: z
      .object({
        required: z.boolean().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .strict()
      .optional(),
    conditional: z
      .object({
        show: z.boolean(),
        when: z.string(),
        eq: z.union([z.string(), z.number(), z.boolean()]),
      })
      .strict()
      .optional(),
    components: z.array(z.unknown()).optional(),
  })
  .strict();
const definitionSchema = z
  .object({
    display: z.literal("form").default("form"),
    type: z.literal("form").default("form"),
    title: z.string().trim().min(1).max(120),
    name: z.string().optional(),
    path: z.string().optional(),
    components: z.array(z.unknown()).min(1).max(50),
  })
  .strict();

// Import only declarative components that the server can also validate.
export function importFormDefinition(raw: unknown): {
  definition: FormDefinition;
  fields: BasicField[];
} {
  if (!withinBudget(raw, 24, 6000))
    throw new Error("Form JSON is too large or deeply nested.");
  const parsed = definitionSchema.parse(raw);
  const fields: BasicField[] = [];
  const keys = new Set<string>();
  const visit = (
    items: unknown[],
    inherited?: Condition,
  ): Record<string, unknown>[] =>
    items.map((item) => {
      const component = componentSchema.parse(item);
      if (keys.has(component.key))
        throw new Error(`Duplicate component key: ${component.key}`);
      keys.add(component.key);
      const own: Condition | undefined = component.conditional
        ? {
            op: component.conditional.show ? "eq" : "neq",
            scope: "root",
            key: component.conditional.when,
            value: component.conditional.eq,
          }
        : undefined;
      const visibility =
        inherited && own
          ? { op: "and" as const, conditions: [inherited, own] }
          : (own ?? inherited);
      if (["panel", "fieldset"].includes(component.type)) {
        if (component.input)
          throw new Error("Layout components cannot be inputs.");
        return {
          ...component,
          components: visit(component.components ?? [], visibility),
        };
      }
      if (component.input === false || component.components)
        throw new Error("Unsupported input component configuration.");
      const input = inputType(component);
      const rules = component.validate ?? {};
      fields.push({
        key: component.key,
        label: component.label ?? component.key,
        input,
        dataType: inputDataType(input),
        required: rules.required ?? false,
        ...rules,
        ...(component.type === "number"
          ? { integer: component.decimalLimit === 0 }
          : {}),
        ...(["select", "radio"].includes(component.type)
          ? { options: component.data?.values ?? component.values }
          : {}),
        ...(visibility ? { visibility } : {}),
      });
      return { ...component, input: true };
    });
  const components = visit(parsed.components);
  const checked = fieldsSchema.parse(fields);
  const fieldKeys = new Set(checked.map((field) => field.key));
  const checkCondition = (condition: Condition): void => {
    if ("conditions" in condition) condition.conditions.forEach(checkCondition);
    else if (!fieldKeys.has(condition.key))
      throw new Error(`Unknown conditional field: ${condition.key}`);
  };
  checked.forEach((field) => {
    if (field.visibility) checkCondition(field.visibility);
  });
  return {
    definition: {
      display: "form",
      type: "form",
      title: parsed.title,
      components,
    },
    fields: checked,
  };
}
function inputType(
  component: z.infer<typeof componentSchema>,
): BasicField["input"] {
  if (component.multiple && component.type !== "select")
    throw new Error(
      "Multiple values are supported only for select components.",
    );
  if (component.type === "textfield")
    return component.inputType === "date" ? "date" : "text";
  if (component.type === "radio") return "select";
  if (component.type === "select")
    return component.multiple ? "multiselect" : "select";
  return component.type as BasicField["input"];
}
