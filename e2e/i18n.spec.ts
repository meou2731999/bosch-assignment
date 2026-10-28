import { test, expect } from "@playwright/test";
import { login } from "./helpers/field-builder";

test("Vietnamese form builder localizes uploads, conditions, defaults and errors", async ({
  page,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await page.getByRole("button", { name: /^User menu:/ }).click();
  await page.getByLabel("Language", { exact: true }).selectOption("vi");
  await page.getByRole("button", { name: /^Menu người dùng:/ }).click();
  await page
    .getByRole("button", { name: "Quản lý biểu mẫu", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Điều hướng quản trị" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tạo loại biểu mẫu", exact: true })
    .click();
  const editor = page.getByRole("region", {
    name: "Tạo loại biểu mẫu",
    exact: true,
  });
  await expect(
    editor.getByRole("link", { name: "Tải JSON mẫu" }),
  ).toBeVisible();
  await editor
    .getByLabel("Tải lên JSON Form.io", { exact: true })
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{"),
    });
  await expect(
    editor.getByRole("alert").filter({ hasText: "Không thể nhập tệp" }),
  ).toBeVisible();
  await editor
    .getByRole("button", { name: "Bỏ qua tải lên", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Thêm trường", exact: true })
    .click();
  await expect(editor.getByLabel("Nhãn trường", { exact: true })).toHaveValue(
    "Trường mới",
  );
  await editor
    .getByRole("button", { name: "Thêm điều kiện hiển thị", exact: true })
    .click();
  await expect(
    editor.getByLabel("Toán tử").locator("option:checked"),
  ).toHaveText("Bằng");
  await expect(
    editor.getByLabel("Phạm vi").locator("option:checked"),
  ).toHaveText("Hàng hiện tại");
  await expect(
    editor.getByText("Chưa có trường phù hợp trong phạm vi này."),
  ).toBeVisible();
  await editor.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: /^Menu người dùng:/ }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("invalid@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Email hoặc mật khẩu không đúng.",
  );
  await page
    .getByRole("combobox", { name: "Ngôn ngữ", exact: true })
    .selectOption("en");
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password.",
  );
});
