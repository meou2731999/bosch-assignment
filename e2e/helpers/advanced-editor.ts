import { expect, type Page } from "@playwright/test";
import { login } from "./field-builder";
import { advancedFields } from "../../tests/fixtures/advanced-fields";
export async function advancedEditor(page: Page) {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("button", { name: "Manage forms", exact: true }),
  ).toBeVisible();
  const session = await (await page.request.get("/api/auth/session")).json();
  const headers = {
    "x-csrf-token": session.csrfToken,
    "x-requested-with": "RequestDesk",
  };
  const created = await page.request.post("/api/admin/forms", {
    headers,
    data: {
      revision: 0,
      name: "Advanced collections",
      description: "Nested fields",
      template: "request-v2",
      fields: advancedFields,
    },
  });
  expect(created.status()).toBe(201);
  const form = await created.json();
  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  const row = page.getByRole("listitem").filter({
    has: page.getByRole("heading", {
      name: "Advanced collections",
      exact: true,
    }),
  });
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  const editor = page.getByRole("region", {
    name: "Edit form draft",
    exact: true,
  });
  await expect(editor.getByLabel("Input type", { exact: true })).toHaveCount(
    10,
  );
  await expect(
    editor.getByLabel("Operator", { exact: true }).first(),
  ).toHaveValue("and");
  await expect(
    editor.getByLabel("Operator", { exact: true }).nth(3),
  ).toHaveValue("or");
  const conditionKeys = editor.getByLabel("Condition field", { exact: true });
  await expect(conditionKeys).toHaveCount(4);
  await expect(conditionKeys.nth(0).locator("option")).toHaveText([
    "Select a field",
    "Name",
    "Needs note",
  ]);
  await expect(conditionKeys.nth(1).locator("option")).toHaveText([
    "Select a field",
    "Enabled",
  ]);
  await expect(conditionKeys.nth(2).locator("option")).toHaveText([
    "Select a field",
    "Title",
    "Tags",
  ]);
  await conditionKeys.nth(0).selectOption("name");
  await expect(conditionKeys.nth(0)).toHaveValue("name");
  await editor
    .getByLabel("Scope", { exact: true })
    .nth(0)
    .selectOption("parent");
  await expect(conditionKeys.nth(0)).toHaveValue("");
  await expect(conditionKeys.nth(0).locator("option")).toHaveText([
    "Select a field",
    "Enabled",
  ]);
  await editor.getByLabel("Scope", { exact: true }).nth(0).selectOption("row");
  await conditionKeys.nth(0).selectOption("needs");
  await editor
    .getByLabel("Field label", { exact: true })
    .nth(7)
    .fill("Row note");
  await editor
    .getByRole("button", { name: "Add field", exact: true })
    .last()
    .click();
  await editor
    .getByLabel("Field label", { exact: true })
    .last()
    .fill("Temporary field");
  await editor
    .getByRole("button", { name: "Remove field", exact: true })
    .last()
    .click();
  await editor
    .getByRole("button", { name: "Preview form", exact: true })
    .last()
    .click();
  const preview = editor
    .getByRole("region", { name: "Preview form", exact: true })
    .last();
  await expect(preview.getByLabel("Tags", { exact: false })).toBeVisible();
  await preview
    .getByRole("group", { name: "People", exact: true })
    .getByRole("button", { name: "Add row", exact: true })
    .click();
  await preview.getByLabel("Enabled", { exact: true }).check();
  await preview.getByLabel("Needs note", { exact: true }).check();
  await preview.getByLabel("Tags", { exact: false }).selectOption(["urgent"]);
  await expect(preview.getByLabel("Row note", { exact: false })).toBeVisible();
  await page.screenshot({
    path: "test-results/advanced-editor-preview.png",
    fullPage: true,
  });
  await editor
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  await expect(editor).toBeHidden();
  const saved = await (
    await page.request.get(`/api/admin/forms/${form.id}`)
  ).json();
  expect(
    (
      await page.request.post(`/api/admin/forms/${form.id}/publish`, {
        headers,
        data: { revision: saved.draft.revision },
      })
    ).status(),
  ).toBe(200);

  return { form, saved, headers };
}
