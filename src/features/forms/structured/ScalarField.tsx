import { useId } from "react";
import type { BasicField } from "../../../../shared/fields";
import { inputClass } from "../../auth/AuthScreen";
export function ScalarField({
  field,
  value,
  readOnly,
  onChange,
}: {
  field: BasicField;
  value: unknown;
  readOnly: boolean;
  onChange: (value: unknown) => void;
}) {
  const id = useId();
  const common = { id, disabled: readOnly, className: inputClass };
  let control;
  if (field.input === "select" || field.input === "multiselect") {
    const multiple = field.input === "multiselect";
    const selected = Array.isArray(value) ? (value as string[]) : [];
    control = (
      <select
        {...common}
        multiple={multiple}
        value={multiple ? selected : String(value ?? "")}
        onChange={(event) =>
          onChange(
            multiple
              ? Array.from(
                  event.target.selectedOptions,
                  (option) => option.value,
                )
              : event.target.value,
          )
        }
      >
        {!multiple && <option value="">—</option>}
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.input === "checkbox")
    return (
      <div className="mb-3 flex items-center gap-2">
        <input
          {...common}
          className="h-4 w-4"
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <label htmlFor={id}>
          {field.label}
          {field.required ? " *" : ""}
        </label>
      </div>
    );
  else if (field.input === "textarea")
    control = (
      <textarea
        {...common}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  else
    control = (
      <input
        {...common}
        type={field.input === "text" ? "text" : field.input}
        value={String(value ?? "")}
        step={field.integer ? "1" : "any"}
        onChange={(event) =>
          onChange(
            field.input === "number" && event.target.value !== ""
              ? Number(event.target.value)
              : event.target.value,
          )
        }
      />
    );
  return (
    <div className="mb-3">
      <label htmlFor={id}>
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {control}
    </div>
  );
}
