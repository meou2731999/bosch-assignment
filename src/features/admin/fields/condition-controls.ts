import type { Condition } from "../../../../shared/field-conditions";
import type { Locale } from "../../../../shared/model";
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
export function conditionCopy(locale: Locale) {
  return locale === "vi"
    ? {
        add: "Thêm điều kiện hiển thị",
        title: "Điều kiện hiển thị",
        op: "Toán tử",
        scope: "Phạm vi",
        key: "Trường điều kiện",
        type: "Kiểu giá trị",
        value: "Giá trị điều kiện",
        child: "Thêm điều kiện",
        remove: "Xóa điều kiện",
      }
    : {
        add: "Add visibility condition",
        title: "Visibility condition",
        op: "Operator",
        scope: "Scope",
        key: "Condition field",
        type: "Value type",
        value: "Condition value",
        child: "Add condition",
        remove: "Remove condition",
      };
}
