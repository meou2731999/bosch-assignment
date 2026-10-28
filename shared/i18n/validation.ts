import type { Locale } from "../model";
export const validationMessages = {
  required: "This field is required.",
  finite: "Enter a finite number.",
  integer: "Enter a whole number.",
  checked: "This checkbox must be checked.",
  email: "Enter a valid email address.",
  date: "Enter a valid date (YYYY-MM-DD).",
  option: "Choose a configured option.",
  uniqueOptions: "Choose unique configured options.",
  object: "Expected object.",
  array: "Expected array.",
  requestType: "Choose a request type.",
  equipment: "Choose equipment.",
  quantity: "Enter a quantity from 1 to 25.",
  application: "Choose an application.",
  accessDays: "Enter access duration from 1 to 365 days.",
  invalid: "Please check this value.",
};
export const validationTranslations: Record<
  keyof typeof validationMessages,
  string
> = {
  required: "Trường này là bắt buộc.",
  finite: "Nhập một số hữu hạn.",
  integer: "Nhập một số nguyên.",
  checked: "Cần đánh dấu ô này.",
  email: "Nhập địa chỉ email hợp lệ.",
  date: "Nhập ngày hợp lệ (YYYY-MM-DD).",
  option: "Chọn một lựa chọn đã cấu hình.",
  uniqueOptions: "Chọn các lựa chọn đã cấu hình, không trùng nhau.",
  object: "Cần dữ liệu dạng đối tượng.",
  array: "Cần dữ liệu dạng mảng.",
  requestType: "Chọn loại yêu cầu.",
  equipment: "Chọn thiết bị.",
  quantity: "Nhập số lượng từ 1 đến 25.",
  application: "Chọn ứng dụng.",
  accessDays: "Nhập thời hạn truy cập từ 1 đến 365 ngày.",
  invalid: "Vui lòng kiểm tra giá trị này.",
};
const templates = {
  min: ["Minimum: {value}.", "Tối thiểu: {value}."],
  max: ["Maximum: {value}.", "Tối đa: {value}."],
  minLength: ["Minimum length: {value}.", "Độ dài tối thiểu: {value}."],
  maxLength: ["Maximum length: {value}.", "Độ dài tối đa: {value}."],
  items: ["Expected {value} items.", "Cần {value} mục."],
  expected: ["Expected {value}.", "Cần dữ liệu kiểu {value}."],
  characters: [
    "Enter at least {value} characters.",
    "Nhập ít nhất {value} ký tự.",
  ],
};
export const validationMessage = (
  key: keyof typeof templates,
  value: string | number,
  locale: Locale = "en",
) => templates[key][locale === "vi" ? 1 : 0].replace("{value}", String(value));
export const translateValidation = (
  message: string,
  locale: Locale,
): string => {
  for (const key of Object.keys(
    validationMessages,
  ) as (keyof typeof validationMessages)[]) {
    if (
      [validationMessages[key], validationTranslations[key]].includes(message)
    )
      return locale === "vi"
        ? validationTranslations[key]
        : validationMessages[key];
  }
  for (const key of Object.keys(templates) as (keyof typeof templates)[]) {
    const [prefix, suffix] = templates[key][0].split("{value}");
    if (message.startsWith(prefix) && message.endsWith(suffix)) {
      const value = message.slice(prefix.length, -suffix.length);
      const types: Record<string, string> = {
        string: "chuỗi",
        number: "số",
        boolean: "đúng/sai",
        object: "đối tượng",
        array: "mảng",
      };
      return validationMessage(
        key,
        locale === "vi" ? (types[value] ?? value) : value,
        locale,
      );
    }
  }
  return locale === "vi" ? validationTranslations.invalid : message;
};
