import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
test("admin creates and edits account; user changes password; reset and disable revoke access", async ({
  page,
  browser,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  const editor = page.getByRole("region", { name: "Create user", exact: true });
  await editor.getByLabel("Name", { exact: true }).fill("Browser User");
  await editor
    .getByLabel("Email", { exact: true })
    .fill("browser@example.test");
  await editor.getByLabel("Department", { exact: true }).fill("Sales");
  await editor
    .getByLabel("Initial password", { exact: true })
    .fill("browser-initial-password");
  await page.screenshot({
    path: "test-results/admin-users.png",
    fullPage: true,
  });
  await editor.getByRole("button", { name: "Save user" }).click();
  const row = page.getByRole("row").filter({ hasText: "browser@example.test" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit user" }).click();
  const edit = page.getByRole("region", { name: "Edit user", exact: true });
  await edit.getByLabel("Name", { exact: true }).fill("Updated Browser User");
  await edit.getByLabel("Department", { exact: true }).fill("Operations");
  await edit.getByRole("button", { name: "Save user" }).click();
  await expect(row).toContainText("Updated Browser User");
  await row.getByRole("button", { name: "Form permissions" }).click();
  const grants = page.getByRole("region", {
    name: "Form permissions",
    exact: true,
  });
  await grants.getByLabel("Create requests", { exact: true }).check();
  await grants.getByRole("button", { name: "Save permissions" }).click();
  await expect(grants).toHaveCount(0);
  const context = await browser.newContext();
  const userPage = await context.newPage();
  await login(userPage, "browser@example.test", "browser-initial-password");
  await expect(
    userPage.getByRole("heading", { name: "Change password" }),
  ).toBeVisible();
  await userPage
    .getByLabel("Current password", { exact: true })
    .fill("browser-initial-password");
  await userPage
    .getByLabel("New password", { exact: true })
    .fill("browser-changed-password");
  await userPage
    .getByLabel("Confirm password", { exact: true })
    .fill("mismatched-password");
  await userPage
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(userPage.getByRole("alert")).toContainText(
    "Passwords do not match",
  );
  await userPage
    .getByLabel("Confirm password", { exact: true })
    .fill("browser-changed-password");
  await userPage
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(
    userPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await login(userPage, "browser@example.test", "browser-changed-password");
  await expect(
    userPage.getByRole("heading", { name: "New request" }),
  ).toBeVisible();
  await expect(
    userPage.getByRole("button", { name: "Manage users" }),
  ).toHaveCount(0);
  await userPage.reload();
  await expect(
    userPage.getByRole("heading", { name: "New request" }),
  ).toBeVisible();
  // Exercise the CSRF-protected existing request save through the new HTTP client.
  await userPage.getByRole("button", { name: "Save draft" }).click();
  await expect(
    userPage.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
  await row.getByRole("button", { name: "Reset password" }).click();
  const reset = page.getByRole("region", {
    name: "Reset password",
    exact: true,
  });
  await reset
    .getByLabel("Initial password", { exact: true })
    .fill("browser-reset-password");
  page.once("dialog", (dialog) => dialog.accept());
  await reset
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Password reset.");
  await userPage.reload();
  await expect(
    userPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await login(userPage, "browser@example.test", "browser-changed-password");
  await expect(userPage.getByRole("alert")).toContainText(
    "Invalid email or password",
  );
  await login(userPage, "browser@example.test", "browser-reset-password");
  await expect(
    userPage.getByRole("heading", { name: "Change password" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Disable user" }).click();
  await expect(row).toContainText("Disabled");
  await userPage.reload();
  await expect(
    userPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await login(userPage, "browser@example.test", "browser-reset-password");
  await expect(userPage.getByRole("alert")).toContainText(
    "Invalid email or password",
  );
  await row.getByRole("button", { name: "Enable user" }).click();
  await expect(row.getByRole("button", { name: "Disable user" })).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await context.close();
});
test("login errors, Vietnamese UI and expired session return to login", async ({
  page,
}) => {
  await login(page, "admin@example.test", "incorrect-password");
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password",
  );
  await page.getByLabel("Language").selectOption("vi");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await page.getByLabel("Ngôn ngữ").selectOption("en");
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users" }),
  ).toBeVisible();
  await page.context().clearCookies();
  await page.getByRole("button", { name: "Requests", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Your session ended");
});
