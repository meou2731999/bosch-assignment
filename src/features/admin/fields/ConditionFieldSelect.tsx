import type { BasicField } from "../../../../shared/fields";
import type { Locale } from "../../../../shared/model";
import { inputClass } from "../../auth/AuthScreen";
import { conditionCopy } from "./condition-controls";

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
  const missingMessage =
    locale === "vi" ? "Chọn trường hiện có." : "Select an existing field.";
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
          {locale === "vi" ? "Chọn trường" : "Select a field"}
        </option>
        {missing && (
          <option value={value} disabled>
            {value} (
            {locale === "vi"
              ? "không còn tồn tại trong phạm vi này"
              : "unavailable in this scope"}
            )
          </option>
        )}
        {candidates.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label} ({field.key})
          </option>
        ))}
      </select>
      {!candidates.length && (
        <small>
          {locale === "vi"
            ? "Chưa có trường phù hợp trong phạm vi này."
            : "No available fields in this scope."}
        </small>
      )}
      {missing && (
        <small role="alert">
          {locale === "vi"
            ? "Chọn lại trường tham chiếu hoặc xóa điều kiện này."
            : "Select an existing field or remove this condition."}
        </small>
      )}
    </label>
  );
};
