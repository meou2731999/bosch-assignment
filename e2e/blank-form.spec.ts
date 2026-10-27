import { test, expect } from "@playwright/test";
import {
  login,
  addField,
  publish,
  prepareRequester,
} from "./helpers/field-builder";

test("create, preview, reopen and submit a blank form without IT template fields", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  await page
    .getByRole("button", { name: "Create form type", exact: true })
    .click();
  const editor = page.getByRole("region", {
    name: "Create form type",
    exact: true,
  });
  await expect(
    editor.getByLabel("Starting template", { exact: true }),
  ).toHaveValue("blank");
  await editor
    .getByLabel("Form name", { exact: true })
    .fill("Visitor registration");
  await expect(editor.getByLabel("Field key", { exact: true })).toHaveCount(0);
  await expect(
    editor.getByRole("button", { name: "Save form draft", exact: true }),
  ).toBeDisabled();
  await addField(editor, "Show visitor", "checkbox");
  const field = await addField(editor, "Visitor name");
  await field.getByLabel("Required", { exact: true }).check();
  await field
    .getByRole("button", { name: "Add visibility condition", exact: true })
    .click();
  await field
    .getByLabel("Condition field", { exact: true })
    .selectOption({ label: "Show visitor" });
  await field.getByLabel("Value type", { exact: true }).selectOption("boolean");
  await field.getByLabel("Condition value", { exact: true }).check();
  await expect(editor.getByLabel("Field key", { exact: true })).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Preview form", exact: true })
    .click();
  const preview = editor.getByRole("region", {
    name: "Preview form",
    exact: true,
  });
  await preview.getByLabel("Show visitor", { exact: true }).check();
  await expect(
    preview.getByLabel("Visitor name", { exact: false }),
  ).toBeVisible();
  await expect(
    preview.getByLabel("Request type", { exact: false }),
  ).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  const row = await publish(page, "Visitor registration", 1);
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  const edit = page.getByRole("region", {
    name: "Edit form draft",
    exact: true,
  });
  await expect(
    edit.getByLabel("Starting template", { exact: true }),
  ).toHaveValue("blank");
  await expect(edit.getByLabel("Field key", { exact: true })).toHaveCount(0);
  await expect(
    edit.getByLabel("Field label", { exact: true }).nth(1),
  ).toHaveValue("Visitor name");
  const condition = edit.getByLabel("Condition field", { exact: true });
  await expect(condition.locator("option:checked")).toHaveText("Show visitor");
  await expect(condition).toHaveValue(/^f_[a-f0-9]{32}$/);

  await edit.getByRole("button", { name: "Cancel", exact: true }).click();
  const context = await browser.newContext({ baseURL });
  try {
    const requester = await context.newPage();
    await prepareRequester(page, requester, "Visitor registration");
    await expect(
      requester.getByLabel("Visitor name", { exact: false }),
    ).toBeHidden();
    await requester.getByLabel("Show visitor", { exact: true }).check();
    await requester.getByLabel("Visitor name", { exact: false }).fill("An");
    await requester
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      requester.getByRole("status").filter({ hasText: "submitted" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
