import type { Condition } from "../../../../shared/field-conditions";
export const emptyCondition: Extract<Condition, { key: string }> = {
  op: "eq",
  scope: "row",
  key: "name",
  value: "",
};
export function changeOperator(
  condition: Condition,
  op: Condition["op"],
): Condition {
  if (op === "and" || op === "or")
    return {
      op,
      conditions:
        "conditions" in condition ? condition.conditions : [condition],
    };
  return { ...("key" in condition ? condition : emptyCondition), op };
}
export function initialValue(type: string) {
  if (type === "boolean") return false;
  if (type === "number") return 0;
  return "";
}
