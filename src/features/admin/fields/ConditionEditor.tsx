import { conditionCopy } from "./condition-copy";
import {
  emptyCondition as leaf,
  changeOperator,
  initialValue,
} from "./condition-controls";
import type { Locale } from "../../../../shared/model";
import type { Condition } from "../../../../shared/field-conditions";
import {
  ConditionFieldSelect,
  type ConditionFields,
} from "./ConditionFieldSelect";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../auth/AuthScreen";
export const ConditionEditor = ({
  condition,
  fields,
  locale,
  onChange,
}: Readonly<{
  condition?: Condition;
  fields: ConditionFields;
  locale: Locale;
  onChange: (condition: Condition | undefined) => void;
}>) => {
  const t = conditionCopy(locale);
  const newCondition = () => ({ ...leaf, key: "" });
  if (!condition)
    return (
      <Button variant="secondary" onClick={() => onChange(newCondition())}>
        {t.add}
      </Button>
    );
  const group = condition.op === "and" || condition.op === "or";
  const changeChild = (index: number, next: Condition | undefined) => {
    if (!condition || !("conditions" in condition)) return;
    onChange({
      ...condition,
      conditions: next
        ? condition.conditions.map((item, i) => (i === index ? next : item))
        : condition.conditions.filter((_, i) => i !== index),
    });
  };
  const addChild = () => {
    if (!condition || !("conditions" in condition)) return;
    onChange({
      ...condition,
      conditions: [...condition.conditions, newCondition()],
    });
  };
  const changeTextValue = (value: string) => {
    if (!condition || !("key" in condition)) return;
    onChange({
      ...condition,
      value: typeof condition.value === "number" ? Number(value) : value,
    });
  };
  const changeOp = (value: string) => {
    if (!condition) return;
    const next = changeOperator(condition, value as Condition["op"]);
    if ("key" in next && !("key" in condition)) next.key = "";
    onChange(next);
  };
  const changeScope = (value: string) => {
    if (condition && "key" in condition) {
      onChange({
        ...condition,
        scope: value as "row" | "parent" | "root",
        key: fields[value as keyof ConditionFields].some(
          (field) => field.key === condition.key,
        )
          ? condition.key
          : "",
      });
    }
  };
  const changeKey = (value: string) => {
    if (condition && "key" in condition) onChange({ ...condition, key: value });
  };
  const changeType = (value: string) => {
    if (condition && "key" in condition) {
      onChange({ ...condition, value: initialValue(value) });
    }
  };
  const changeBooleanValue = (value: boolean) => {
    if (condition && "key" in condition) onChange({ ...condition, value });
  };
  return (
    <fieldset className="editor-condition" aria-label={t.title}>
      <legend>{t.title}</legend>
      <label>
        {t.op}
        <select
          className={inputClass}
          aria-label={t.op}
          value={condition.op}
          onChange={(event) => changeOp(event.target.value)}
        >
          {(["eq", "neq", "contains", "and", "or"] as const).map((op) => (
            <option key={op} value={op}>
              {t.operators[op]}
            </option>
          ))}
        </select>
      </label>
      {group && "conditions" in condition ? (
        <>
          {condition.conditions.map((child, index) => (
            <ConditionEditor
              key={index + "Editor"}
              condition={child}
              fields={fields}
              locale={locale}
              onChange={(next) => changeChild(index, next)}
            />
          ))}
          <Button variant="secondary" onClick={addChild}>
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
                onChange={(event) => changeScope(event.target.value)}
              >
                {(["row", "parent", "root"] as const).map((scope) => (
                  <option key={scope} value={scope}>
                    {t.scopes[scope]}
                  </option>
                ))}
              </select>
            </label>
            <ConditionFieldSelect
              fields={fields[condition.scope]}
              value={condition.key}
              locale={locale}
              onChange={changeKey}
            />
            <label>
              {t.type}
              <select
                className={inputClass}
                aria-label={t.type}
                value={typeof condition.value}
                onChange={(event) => changeType(event.target.value)}
              >
                {(["string", "number", "boolean"] as const).map((type) => (
                  <option key={type} value={type}>
                    {t.types[type]}
                  </option>
                ))}
              </select>
            </label>
            {typeof condition.value === "boolean" ? (
              <label>
                {t.value}
                <input
                  type="checkbox"
                  checked={condition.value}
                  onChange={(event) => changeBooleanValue(event.target.checked)}
                />
              </label>
            ) : (
              <label>
                {t.value}
                <input
                  className={inputClass}
                  type={typeof condition.value === "number" ? "number" : "text"}
                  value={String(condition.value)}
                  onChange={(event) => changeTextValue(event.target.value)}
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
};
