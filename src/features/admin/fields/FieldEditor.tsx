import { uiCopy } from "../../../i18n/ui";
import {
  inputDataType,
  inputForType,
  type BasicField,
} from "../../../../shared/fields";
import type { Locale } from "../../../../shared/model";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../auth/AuthScreen";
import { fieldCopy } from "./copy";
import { FieldsEditor } from "./FieldsEditor";
import type { ConditionFields } from "./ConditionFieldSelect";
import { ConditionEditor } from "./ConditionEditor";
import { FieldValidationEditor } from "./FieldValidationEditor";
export const FieldEditor = ({
  field,
  index,
  count,
  conditionFields,
  rootFields,
  parentFields,
  locale,
  onChange,
  onMove,
  onRemove,
}: Readonly<{
  field: BasicField;
  index: number;
  count: number;
  conditionFields: ConditionFields;
  rootFields: BasicField[];
  parentFields: BasicField[];
  locale: Locale;
  onChange: (field: BasicField) => void;
  onMove: (direction: number) => void;
  onRemove: () => void;
}>) => {
  const t = fieldCopy(locale);
  const changeInput = (input: BasicField["input"]) => {
    onChange({
      key: field.key,
      label: field.label,
      input,
      dataType: inputDataType(input),
      required: field.required,
      visibility: field.visibility,
      ...(["object", "repeat", "table"].includes(input)
        ? {
            fields: [
              {
                key: `tmp_${crypto.randomUUID().replaceAll("-", "")}`,
                label: uiCopy(locale).defaultName,
                input: "text" as const,
                dataType: "string" as const,
                required: false,
              },
            ],
          }
        : {}),
      ...(input === "select" || input === "multiselect"
        ? {
            options: [{ label: uiCopy(locale).defaultOption, value: "option" }],
          }
        : {}),
    });
  };
  return (
    <fieldset
      className="ui-form-stack rounded-lg border border-line p-4"
      aria-label={`${t.fields} ${index + 1}`}
    >
      <legend>
        {t.fields} {index + 1}
      </legend>
      <label>
        {t.label}
        <input
          className={inputClass}
          value={field.label}
          onChange={(event) =>
            onChange({ ...field, label: event.target.value })
          }
        />
      </label>
      <label>
        {t.input}
        <select
          className={inputClass}
          aria-label={t.input}
          value={field.input}
          onChange={(event) =>
            changeInput(event.target.value as BasicField["input"])
          }
        >
          {(
            [
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
            ] as const
          ).map((input) => (
            <option key={input} value={input}>
              {t[input]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.dataType}
        <select
          className={inputClass}
          aria-label={t.dataType}
          value={field.dataType}
          onChange={(event) =>
            changeInput(
              inputForType(event.target.value as BasicField["dataType"]),
            )
          }
        >
          {(["string", "number", "boolean", "object", "array"] as const).map(
            (type) => (
              <option key={type} value={type}>
                {t[type]}
              </option>
            ),
          )}
        </select>
      </label>
      <FieldValidationEditor
        key={field.input}
        field={field}
        locale={locale}
        onChange={onChange}
      />
      <ConditionEditor
        fields={conditionFields}
        locale={locale}
        condition={field.visibility}
        onChange={(visibility) => onChange({ ...field, visibility })}
      />
      {field.fields && (
        <FieldsEditor
          fields={field.fields}
          rootFields={rootFields}
          parentFields={parentFields}
          locale={locale}
          onChange={(fields) => onChange({ ...field, fields })}
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => onMove(-1)}
        >
          {t.up}
        </Button>
        <Button
          variant="secondary"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
        >
          {t.down}
        </Button>
        <Button variant="danger" onClick={onRemove}>
          {t.remove}
        </Button>
      </div>
    </fieldset>
  );
};
