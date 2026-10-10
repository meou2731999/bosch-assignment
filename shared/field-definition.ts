import type { BasicField } from "./fields";
import type { FormDefinition } from "./forms";
export function fieldDefinition(
  title: string,
  fields: BasicField[],
): FormDefinition {
  return {
    display: "form",
    type: "form",
    title,
    components: fields.map((field) => ({
      key: field.key,
      label: field.label,
      input: true,
      type: componentType(field),
      ...(field.input === "date" ? { inputType: "date" } : {}),
      ...(field.fields
        ? { components: fieldDefinition(title, field.fields).components }
        : {}),
      ...(field.input === "multiselect" ? { multiple: true } : {}),
      ...(field.input === "select" || field.input === "multiselect"
        ? {
            widget: "html5",
            dataSrc: "values",
            data: { values: field.options },
          }
        : {}),
      validate: {
        required: field.required,
        minLength: field.minLength,
        maxLength:
          field.maxLength ?? (field.dataType === "string" ? 10000 : undefined),
        min: field.min,
        max: field.max,
      },
      ...(field.input === "number"
        ? { decimalLimit: field.integer ? 0 : 15, requireDecimal: false }
        : {}),
    })),
  };
}
function componentType(field: BasicField) {
  return (
    {
      text: "textfield",
      date: "textfield",
      textarea: "textarea",
      email: "email",
      number: "number",
      checkbox: "checkbox",
      select: "select",
      multiselect: "select",
      object: "container",
      repeat: "editgrid",
      table: "datagrid",
    } as const
  )[field.input];
}
