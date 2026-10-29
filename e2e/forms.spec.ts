import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function createForm(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Create form type", exact: true })
    .click();
  await page.getByRole("button", { name: "Skip upload", exact: true }).click();
  const editor = page.getByRole("region", {
    name: "Create form type",
    exact: true,
  });
  await editor
    .getByLabel("Starting template", { exact: true })
    .selectOption("request-v2");
  await editor.getByLabel("Form name", { exact: true }).fill(name);
  await editor
    .getByLabel("Description", { exact: true })
    .fill("Browser form test");
  await editor.getByRole("button", { name: "Save form draft" }).click();
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name, exact: true }) });
  await expect(row).toContainText("Not published");
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Publish form", exact: true })
    .click();
  await expect(row.getByRole("cell").nth(1)).toHaveText("1");
}
test("admin publishes form types, grants scoped creation and preserves old draft version", async ({
  page,
  browser,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Manage forms", exact: true }),
  ).toBeVisible();
  await createForm(page, "Procurement");
  await createForm(page, "Facilities");
  await page.getByRole("button", { name: "Manage users", exact: true }).click();
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  const editor = page.getByRole("region", { name: "Create user", exact: true });
  await editor.getByLabel("Name", { exact: true }).fill("Form requester");
  await editor
    .getByLabel("Email", { exact: true })
    .fill("form-requester@example.test");
  await editor.getByLabel("Department", { exact: true }).fill("Operations");
  await editor
    .getByLabel("Initial password", { exact: true })
    .fill("form-initial-password");
  await editor.getByRole("button", { name: "Save user" }).click();
  const user = page
    .getByRole("row")
    .filter({ hasText: "form-requester@example.test" });
  await user.getByRole("button", { name: /^Actions:/ }).click();
  await user
    .getByRole("menuitem", { name: "Form permissions", exact: true })
    .click();
  const grants = page.getByRole("region", {
    name: "Form permissions",
    exact: true,
  });
  await grants
    .getByRole("group", { name: "Procurement · v1", exact: true })
    .getByLabel("Create requests", { exact: true })
    .check();
  await page.screenshot({
    path: "test-results/form-permissions.png",
    fullPage: true,
  });
  await grants
    .getByRole("button", { name: "Save permissions", exact: true })
    .click();
  await expect(grants).toHaveCount(0);
  const context = await browser.newContext();
  const userPage = await context.newPage();
  await login(userPage, "form-requester@example.test", "form-initial-password");
  await userPage
    .getByLabel("Current password", { exact: true })
    .fill("form-initial-password");
  await userPage
    .getByLabel("New password", { exact: true })
    .fill("form-changed-password");
  await userPage
    .getByLabel("Confirm password", { exact: true })
    .fill("form-changed-password");
  await userPage
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await expect(
    userPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await login(userPage, "form-requester@example.test", "form-changed-password");
  await userPage
    .getByRole("button", { name: "New request", exact: true })
    .click();
  const types = userPage.getByLabel("Form type", { exact: true });
  await expect(types.locator("option")).toHaveText(["Procurement"]);
  await userPage
    .getByRole("button", { name: "Save draft", exact: true })
    .click();
  await expect(
    userPage.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  const form = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Procurement", exact: true }),
  });
  await form.getByRole("button", { name: /^Actions:/ }).click();
  await form
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  const edit = page.getByRole("region", {
    name: "Edit form draft",
    exact: true,
  });
  await edit
    .getByLabel("Form name", { exact: true })
    .fill("Procurement updated");
  await edit
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  const changed = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Procurement updated", exact: true }),
  });
  page.once("dialog", (dialog) => dialog.accept());
  await changed.getByRole("button", { name: /^Actions:/ }).click();
  await changed
    .getByRole("menuitem", { name: "Publish form", exact: true })
    .click();
  await expect(changed.getByRole("cell").nth(1)).toHaveText("2");
  await userPage
    .getByRole("button", { name: "Back to requests", exact: true })
    .click();
  await userPage
    .getByRole("button", { name: "New request", exact: true })
    .click();
  await expect(types.locator("option")).toHaveText(["Procurement updated"]);
  await expect(
    userPage
      .getByRole("region", { name: "New request", exact: true })
      .getByText("Form version", { exact: false }),
  ).toContainText("2");
  await userPage
    .getByRole("button", { name: "Back to requests", exact: true })
    .click();
  await userPage
    .getByRole("row")
    .filter({
      has: userPage.getByRole("cell", {
        name: "Untitled request",
        exact: true,
      }),
    })
    .click();
  await expect(
    userPage
      .getByRole("region", { name: "New request", exact: true })
      .getByText("Form version", { exact: false }),
  ).toContainText("1");
  await page.getByRole("button", { name: "Manage users", exact: true }).click();
  await user.getByRole("button", { name: /^Actions:/ }).click();
  await user
    .getByRole("menuitem", { name: "Form permissions", exact: true })
    .click();
  await grants
    .getByRole("group", { name: "Procurement updated · v2", exact: true })
    .getByLabel("Create requests", { exact: true })
    .uncheck();
  await grants
    .getByRole("button", { name: "Save permissions", exact: true })
    .click();
  await expect(grants).toHaveCount(0);
  await userPage.reload();
  await expect(
    userPage.getByRole("heading", { name: "Sign in" }),
  ).toBeVisible();
  await login(userPage, "form-requester@example.test", "form-changed-password");
  await expect(
    userPage.getByText(
      "You have no form types available for creating requests.",
    ),
  ).toBeVisible();
  await expect(
    userPage.getByRole("button", { name: "Save draft" }),
  ).toHaveCount(0);
  await context.close();
});
