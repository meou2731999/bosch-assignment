import { uiCopy } from "../../../i18n/ui";
import type { BasicField } from "../../../../shared/fields";
import type { Locale } from "../../../../shared/model";
import { inputClass } from "../../auth/AuthScreen";
import { conditionCopy } from "./condition-copy";

export type ConditionFields = Readonly<
  Record<"root" | "row" | "parent", BasicField[]>
>;

export const ConditionFieldSelect = ({
  fields,
  value,
  locale,
  onChange,
}: Readonly<{
  fields: BasicField[];
  value: string;
  locale: Locale;
  onChange: (key: string) => void;
}>) => {
  const candidates = fields.filter(
    (field) => !["object", "repeat", "table"].includes(field.input),
  );
  const missing = value && !candidates.some((field) => field.key === value);
  const t = conditionCopy(locale);
  const missingMessage = uiCopy(locale).selectExistingField;
  return (
    <label>
      {t.key}
      <select
        className={inputClass}
        aria-label={t.key}
        ref={(select) => {
          select?.setCustomValidity(missing ? missingMessage : "");
        }}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          {uiCopy(locale).selectField}
        </option>
        {missing && (
          <option value={value} disabled>
            {uiCopy(locale).unavailableField}
          </option>
        )}
        {candidates.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label}
          </option>
        ))}
      </select>
      {!candidates.length && <small>{uiCopy(locale).noFieldsInScope}</small>}
      {missing && <small role="alert">{uiCopy(locale).fixCondition}</small>}
    </label>
  );
};
