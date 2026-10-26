import { useState } from "react";
import type { BasicField } from "../../../../shared/fields";
import type { Locale } from "../../../../shared/model";
import { inputClass } from "../../auth/AuthScreen";
import { fieldCopy } from "./copy";
export function FieldValidationEditor({
  field,
  locale,
  onChange,
}: Readonly<{
  field: BasicField;
  locale: Locale;
  onChange: (field: BasicField) => void;
}>) {
  const t = fieldCopy(locale);
  const [options, setOptions] = useState(
    () =>
      field.options
        ?.map((option) => `${option.label}=${option.value}`)
        .join("\n") ?? "",
  );
  const bounds =
    field.dataType === "number"
      ? (["min", "max"] as const)
      : (["minLength", "maxLength"] as const);
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(event) =>
            onChange({ ...field, required: event.target.checked })
          }
        />
        {t.required}
      </label>
      {["string", "number", "array"].includes(field.dataType) &&
        bounds.map((key) => (
          <label key={key}>
            {t[key]}
            <input
              className={inputClass}
              type="number"
              step={field.dataType === "number" ? "any" : "1"}
              value={field[key] ?? ""}
              onChange={(event) =>
                onChange({
                  ...field,
                  [key]:
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                })
              }
            />
          </label>
        ))}
      {field.dataType === "number" && (
        <label>
          <input
            type="checkbox"
            checked={field.integer ?? false}
            onChange={(event) =>
              onChange({ ...field, integer: event.target.checked })
            }
          />
          {t.integer}
        </label>
      )}
      {(field.input === "select" || field.input === "multiselect") && (
        <label>
          {t.options}
          <textarea
            className={inputClass}
            value={options}
            onChange={(event) => {
              setOptions(event.target.value);
              onChange({
                ...field,
                options: event.target.value
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => {
                    const index = line.indexOf("=");
                    return {
                      label: index < 0 ? line : line.slice(0, index),
                      value: index < 0 ? "" : line.slice(index + 1),
                    };
                  }),
              });
            }}
          />
        </label>
      )}
    </>
  );
}
