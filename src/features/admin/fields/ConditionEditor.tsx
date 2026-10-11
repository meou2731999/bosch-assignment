import {
  emptyCondition as leaf,
  changeOperator,
  initialValue,
  conditionCopy,
} from "./condition-controls";
import type { Locale } from "../../../../shared/model";
import type { Condition } from "../../../../shared/field-conditions";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../auth/AuthScreen";
export function ConditionEditor({
  condition,
  locale,
  onChange,
}: {
  condition?: Condition;
  locale: Locale;
  onChange: (condition: Condition | undefined) => void;
}) {
  const t = conditionCopy(locale);
  if (!condition)
    return (
      <Button variant="secondary" onClick={() => onChange({ ...leaf })}>
        {t.add}
      </Button>
    );
  const group = condition.op === "and" || condition.op === "or";
  return (
    <fieldset className="editor-condition" aria-label={t.title}>
      <legend>{t.title}</legend>
      <label>
        {t.op}
        <select
          className={inputClass}
          aria-label={t.op}
          value={condition.op}
          onChange={(event) => {
            const op = event.target.value as Condition["op"];
            onChange(changeOperator(condition, op));
          }}
        >
          {["eq", "neq", "contains", "and", "or"].map((op) => (
            <option key={op}>{op}</option>
          ))}
        </select>
      </label>
      {group && "conditions" in condition ? (
        <>
          {condition.conditions.map((child, index) => (
            <ConditionEditor
              key={index}
              condition={child}
              locale={locale}
              onChange={(next) =>
                onChange({
                  ...condition,
                  conditions: next
                    ? condition.conditions.map((item, i) =>
                        i === index ? next : item,
                      )
                    : condition.conditions.filter((_, i) => i !== index),
                })
              }
            />
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              onChange({
                ...condition,
                conditions: [...condition.conditions, { ...leaf }],
              })
            }
          >
            {t.child}
          </Button>
        </>
      ) : (
        "key" in condition && (
          <>
            <label>
              {t.scope}
              <select
                className={inputClass}
                aria-label={t.scope}
                value={condition.scope}
                onChange={(event) =>
                  onChange({
                    ...condition,
                    scope: event.target.value as "row" | "parent" | "root",
                  })
                }
              >
                {["row", "parent", "root"].map((scope) => (
                  <option key={scope}>{scope}</option>
                ))}
              </select>
            </label>
            <label>
              {t.key}
              <input
                className={inputClass}
                value={condition.key}
                onChange={(event) =>
                  onChange({ ...condition, key: event.target.value })
                }
              />
            </label>
            <label>
              {t.type}
              <select
                className={inputClass}
                aria-label={t.type}
                value={typeof condition.value}
                onChange={(event) =>
                  onChange({
                    ...condition,
                    value: initialValue(event.target.value),
                  })
                }
              >
                {["string", "number", "boolean"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            {typeof condition.value === "boolean" ? (
              <label>
                {t.value}
                <input
                  type="checkbox"
                  checked={condition.value}
                  onChange={(event) =>
                    onChange({ ...condition, value: event.target.checked })
                  }
                />
              </label>
            ) : (
              <label>
                {t.value}
                <input
                  className={inputClass}
                  type={typeof condition.value === "number" ? "number" : "text"}
                  value={String(condition.value)}
                  onChange={(event) =>
                    onChange({
                      ...condition,
                      value:
                        typeof condition.value === "number"
                          ? Number(event.target.value)
                          : event.target.value,
                    })
                  }
                />
              </label>
            )}
          </>
        )
      )}
      <Button variant="danger" onClick={() => onChange(undefined)}>
        {t.remove}
      </Button>
    </fieldset>
  );
}
