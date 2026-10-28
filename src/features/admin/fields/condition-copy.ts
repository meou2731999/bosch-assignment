import type { Locale } from "../../../../shared/model";
export function conditionCopy(locale: Locale) {
  return locale === "vi"
    ? {
        operators: {
          eq: "Bằng",
          neq: "Khác",
          contains: "Chứa",
          and: "Tất cả điều kiện",
          or: "Một trong các điều kiện",
        },
        scopes: {
          row: "Hàng hiện tại",
          parent: "Cấp cha",
          root: "Toàn biểu mẫu",
        },
        types: { string: "Chuỗi", number: "Số", boolean: "Đúng/Sai" },
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
        operators: {
          eq: "Equals",
          neq: "Does not equal",
          contains: "Contains",
          and: "All conditions",
          or: "Any condition",
        },
        scopes: { row: "Current row", parent: "Parent", root: "Entire form" },
        types: { string: "String", number: "Number", boolean: "Boolean" },
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
