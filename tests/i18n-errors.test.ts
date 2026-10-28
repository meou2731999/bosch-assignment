import { expect, it } from "vitest";
import { errorMessage, clientErrors } from "../src/i18n/errors";
import {
  translateValidation,
  validationMessage,
} from "../shared/i18n/validation";
import { validateFields } from "../shared/field-validation";

it("translates stored API/client errors at render time in both languages", () => {
  expect(errorMessage("Invalid email or password.", "vi")).toBe(
    "Email hoặc mật khẩu không đúng.",
  );
  const translated = errorMessage(clientErrors.network, "vi");
  expect(translated).toContain("Không thể kết nối API");
  expect(errorMessage(translated, "en")).toBe(clientErrors.network);
  expect(
    errorMessage(
      "Please complete the required fields and check the values below.",
      "vi",
    ),
  ).toContain("Hãy điền các trường bắt buộc");
});
it("retains validation bounds and translates errors returned by the field validator", () => {
  const result = validateFields(
    [
      {
        key: "age",
        label: "Age",
        input: "number",
        dataType: "number",
        required: true,
        min: 18,
      },
    ],
    { age: 12 },
    true,
  );
  expect(translateValidation(result.errors.age, "vi")).toBe("Tối thiểu: 18.");
  expect(translateValidation(validationMessage("items", "1–5"), "vi")).toBe(
    "Cần 1–5 mục.",
  );
  expect(translateValidation("Expected number.", "vi")).toBe(
    "Cần dữ liệu kiểu số.",
  );
  expect(translateValidation("This field is required.", "vi")).toBe(
    "Trường này là bắt buộc.",
  );
});
