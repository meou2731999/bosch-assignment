import { test, expect } from "@playwright/test";
import { login, publish, prepareRequester } from "./helpers/field-builder";

test("upload JSON, recover from invalid files, publish and submit the stored form", async ({
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
  const upload = editor.getByLabel("Upload Form.io JSON", { exact: true });
  await upload.setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await expect(
    editor.getByRole("alert").filter({ hasText: "Could not import" }),
  ).toBeVisible();
  const definition = {
    title: "Uploaded visitor form",
    components: [
      {
        type: "textfield",
        key: "visitor",
        label: "Visitor name",
        input: true,
        validate: { required: true },
      },
    ],
  };
  await upload.setInputFiles({
    name: "visitor.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(definition)),
  });
  await expect(editor.getByLabel("Form name", { exact: true })).toHaveValue(
    definition.title,
  );
  await expect(
    editor
      .getByRole("region", { name: "Form preview" })
      .getByLabel("Visitor name", { exact: false }),
  ).toBeVisible();
  await upload.setInputFiles({
    name: "unsupported.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...definition, components: [{ type: "custom" }] }),
    ),
  });
  await expect(editor.getByRole("alert")).toContainText("Could not import");
  await expect(editor.getByLabel("Form name", { exact: true })).toHaveValue(
    definition.title,
  );
  await editor
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  const row = await publish(page, definition.title, 1);
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Form preview" })
      .getByLabel("Visitor name", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const context = await browser.newContext({ baseURL });
  try {
    const requester = await context.newPage();
    await prepareRequester(page, requester, definition.title);
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
