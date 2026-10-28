import { test, expect } from "@playwright/test";
import {
  login,
  publish,
  prepareRequester,
  addField,
} from "./helpers/field-builder";

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
  await expect(editor.getByLabel("Field label", { exact: true })).toHaveValue(
    "Visitor name",
  );
  await expect(
    editor.getByRole("region", { name: "Form preview", exact: true }),
  ).toHaveCount(0);
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
  const edit = page.getByRole("region", {
    name: "Edit form draft",
    exact: true,
  });
  await expect(edit.getByLabel("Field label", { exact: true })).toHaveValue(
    "Visitor name",
  );
  await edit.getByLabel("Field label", { exact: true }).fill("Full name");
  const email = await addField(edit, "Contact email", "email");
  await email.getByLabel("Required", { exact: true }).check();
  const temporary = await addField(edit, "Remove me");
  await temporary
    .getByRole("button", { name: "Remove field", exact: true })
    .click();
  await edit.getByRole("button", { name: "Preview form", exact: true }).click();
  const preview = edit.getByRole("region", {
    name: "Preview form",
    exact: true,
  });
  await expect(preview.getByLabel("Full name", { exact: false })).toBeVisible();
  await expect(
    preview.getByLabel("Contact email", { exact: false }),
  ).toBeVisible();
  await expect(preview.getByLabel("Remove me", { exact: false })).toHaveCount(
    0,
  );
  await edit
    .getByRole("button", { name: "Save form draft", exact: true })
    .click();
  await publish(page, definition.title, 2);
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Edit form draft", exact: true })
    .click();
  await expect(
    edit.getByLabel("Field label", { exact: true }).nth(0),
  ).toHaveValue("Full name");
  await expect(
    edit.getByLabel("Field label", { exact: true }).nth(1),
  ).toHaveValue("Contact email");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const context = await browser.newContext({ baseURL });
  try {
    const requester = await context.newPage();
    await prepareRequester(page, requester, definition.title);
    await requester.getByLabel("Full name", { exact: false }).fill("An");
    await requester
      .getByLabel("Contact email", { exact: false })
      .fill("an@example.test");
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
