import { test, expect, type Locator } from "@playwright/test";
import { login } from "./helpers/field-builder";

async function checkFields(root: Locator) {
  const gaps = await root
    .locator(".ui-field:visible")
    .evaluateAll((elements) =>
      elements.map((element) =>
        Number.parseFloat(getComputedStyle(element).marginTop),
      ),
    );
  expect(gaps.length).toBeGreaterThan(0);
  for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(8);
  const stacks = await root
    .locator(".ui-form-stack")
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).rowGap),
    );
  for (const gap of stacks)
    expect(Number.parseFloat(gap)).toBeGreaterThanOrEqual(20);
}
async function checkActions(control: Locator, action: Locator) {
  await action.scrollIntoViewIfNeeded();
  const field = await control.boundingBox(),
    button = await action.boundingBox();
  expect(button!.y - field!.y - field!.height).toBeGreaterThanOrEqual(19);
}

test("form spacing stays consistent across auth, account dialogs and the field editor", async ({
  page,
}) => {
  await page.goto("/");
  await checkFields(page.locator("body"));
  await checkActions(
    page.getByLabel("Password", { exact: true }),
    page.getByRole("button", { name: "Sign in", exact: true }),
  );
  await page.screenshot({
    path: "test-results/spacing-login.png",
    fullPage: true,
  });
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create user", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await checkFields(dialog);
  await checkActions(
    dialog.getByLabel("Initial password", { exact: true }),
    dialog.getByRole("button", { name: "Save user", exact: true }),
  );
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "admin@example.test" });
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row.getByRole("menuitem", { name: "Edit user", exact: true }).click();
  await checkFields(dialog);
  const checkboxGap = await dialog
    .getByLabel("Administrator", { exact: true })
    .evaluate((element) => getComputedStyle(element.parentElement!).columnGap);
  expect(Number.parseFloat(checkboxGap)).toBeGreaterThanOrEqual(10);
  await dialog.screenshot({ path: "test-results/spacing-edit-user.png" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Reset password", exact: true })
    .click();
  await checkFields(dialog);
  await checkActions(
    dialog.getByLabel("Initial password", { exact: true }),
    dialog.getByRole("button", { name: "Reset password", exact: true }),
  );
  await dialog.screenshot({ path: "test-results/spacing-reset-desktop.png" });
  await page.setViewportSize({ width: 390, height: 650 });
  await checkActions(
    dialog.getByLabel("Initial password", { exact: true }),
    dialog.getByRole("button", { name: "Reset password", exact: true }),
  );
  await dialog.screenshot({ path: "test-results/spacing-reset-mobile.png" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Form permissions", exact: true })
    .click();
  await expect(dialog.locator(".ui-form-stack")).toHaveCSS("row-gap", "20px");
  await dialog.screenshot({ path: "test-results/spacing-permissions.png" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  await page
    .getByRole("button", { name: "Create form type", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await checkFields(dialog);
  await dialog.getByLabel("Use custom fields", { exact: true }).check();
  await dialog.getByRole("button", { name: "Add field", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Add visibility condition", exact: true })
    .click();
  await checkFields(dialog);
  const condition = dialog.locator(".editor-condition");
  await expect(condition).toHaveCSS("row-gap", "16px");
  await condition.screenshot({ path: "test-results/spacing-condition.png" });
  await page.setViewportSize({ width: 390, height: 650 });
  await checkFields(dialog);
  await condition.screenshot({
    path: "test-results/spacing-condition-mobile.png",
  });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: /^User menu:/ }).click();
  await page
    .getByRole("button", { name: "Change password", exact: true })
    .click();
  await checkFields(page.locator("body"));
  await checkActions(
    page.getByLabel("Confirm password", { exact: true }),
    page.getByRole("button", { name: "Change password", exact: true }),
  );
  await page.screenshot({
    path: "test-results/spacing-change-password.png",
    fullPage: true,
  });
});
