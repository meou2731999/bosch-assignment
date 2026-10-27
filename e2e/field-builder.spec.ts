import { test, expect } from "@playwright/test";
import {
  login,
  addField,
  publish,
  prepareRequester,
} from "./helpers/field-builder";
test("admin edits and previews fields; requester loads published JSON without frontend reload", async ({
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
  await editor.getByLabel("Form name", { exact: true }).fill("Dynamic travel");
  const title = await addField(editor, "Trip title");
  await title.getByLabel("Required", { exact: true }).check();
  await title.getByLabel("Minimum length", { exact: true }).fill("3");
  const count = await addField(editor, "Travel days", "number");
  await count.getByLabel("Required", { exact: true }).check();
  await count.getByLabel("Minimum value", { exact: true }).fill("1");
  await count.getByLabel("Maximum value", { exact: true }).fill("5");
  await count.getByLabel("Whole numbers only", { exact: true }).check();
  await count.getByRole("button", { name: "Move up", exact: true }).click();
  await expect(
    editor
      .getByRole("group", { name: "Fields 1", exact: true })
      .getByLabel("Field label", { exact: true }),
  ).toHaveValue("Travel days");
  const unused = await addField(editor, "Remove me");
  await unused
    .getByRole("button", { name: "Remove field", exact: true })
    .click();
  await editor
    .getByRole("button", { name: "Preview form", exact: true })
    .click();
  const preview = editor.getByRole("region", {
    name: "Preview form",
    exact: true,
  });
  await expect(
    preview.getByLabel("Travel days", { exact: false }),
  ).toBeVisible();
  await expect(
    preview.getByLabel("Trip title", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/field-editor-preview.png",
    fullPage: true,
  });
  await editor
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  const row = await publish(page, "Dynamic travel", 1);
  const context = await browser.newContext({ baseURL });
  const requester = await context.newPage();
  await prepareRequester(page, requester, "Dynamic travel");
  await expect(
    requester.getByLabel("Trip title", { exact: false }),
  ).toBeVisible();
  await requester
    .getByLabel("Trip title", { exact: false })
    .fill("Annual meeting");
  await requester.getByLabel("Travel days", { exact: false }).fill("4");
  await requester
    .getByRole("button", { name: "Save draft", exact: true })
    .click();
  await expect(
    requester.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
  // Same document stays open across publication; this marker detects a page reload.
  await requester.evaluate(() => {
    document.documentElement.dataset.schemaSession = "same-document";
  });
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  const edit = page.getByRole("region", {
    name: "Edit form draft",
    exact: true,
  });
  await edit
    .getByRole("group", { name: "Fields 1", exact: true })
    .getByLabel("Maximum value", { exact: true })
    .fill("2");
  const email = await addField(edit, "Contact email", "email");
  await email.getByLabel("Required", { exact: true }).check();
  await edit
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  await publish(page, "Dynamic travel", 2);
  await requester
    .getByRole("button", { name: "New request", exact: true })
    .click();
  await expect(
    requester.getByLabel("Contact email", { exact: false }),
  ).toBeVisible();
  expect(
    await requester.evaluate(
      () => document.documentElement.dataset.schemaSession,
    ),
  ).toBe("same-document");
  await requester
    .getByLabel("Trip title", { exact: false })
    .fill("New meeting");
  await requester.getByLabel("Travel days", { exact: false }).fill("3");
  await requester
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(requester.getByRole("alert")).toContainText("Maximum: 2.");
  await requester.getByLabel("Travel days", { exact: false }).fill("2");
  await requester
    .getByLabel("Contact email", { exact: false })
    .fill("team@example.test");
  await requester
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(
    requester.getByRole("status").filter({ hasText: "Request submitted." }),
  ).toBeVisible();
  await requester.getByRole("button").filter({ hasText: "v1" }).click();
  await expect(
    requester.getByLabel("Travel days", { exact: false }),
  ).toHaveValue("4");
  await expect(
    requester.getByLabel("Contact email", { exact: false }),
  ).toHaveCount(0);
  await requester
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(
    requester.getByRole("status").filter({ hasText: "Request submitted." }),
  ).toBeVisible();
  await context.close();
});
