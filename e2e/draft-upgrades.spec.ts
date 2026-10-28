import { test, expect } from "@playwright/test";
import { prepareRequester } from "./helpers/field-builder";
import {
  upgradeForm,
  saveDraft,
  history,
  confirmPreview,
  correctPreview,
} from "./helpers/draft-upgrades";
test("requester reviews/cancels upgrade, corrects invalid values and restores original schema and files", async ({
  page,
  browser,
  baseURL,
}) => {
  const setup = await upgradeForm(page, "Upgrade and restore");
  const context = await browser.newContext({ baseURL });
  const user = await context.newPage();
  await prepareRequester(page, user, setup.form.draft.name);
  await user
    .getByLabel("Title", { exact: false })
    .fill("Upgrade browser draft");
  await user.getByLabel("Amount", { exact: false }).fill("5");
  await user
    .getByLabel("Obsolete", { exact: false })
    .fill("Keep this old data");
  await user.locator('input[type="file"]').setInputFiles({
    name: "restore.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("restored attachment bytes"),
  });
  await expect(
    user.getByRole("button", { name: "Remove restore.txt", exact: true }),
  ).toBeVisible();
  await saveDraft(user);
  const initial = (await (await user.request.get("/api/requests")).json())[0];
  await setup.publishNext();
  await history(user)
    .getByRole("button", { name: "Refresh versions", exact: true })
    .click();
  await expect(history(user)).toContainText("Latest published version: 2");
  await user.getByLabel("Title", { exact: false }).fill("Local unsaved edit");
  await expect(
    history(user).getByRole("button", { name: "Preview upgrade", exact: true }),
  ).toBeDisabled();
  await expect(history(user)).toContainText(
    "Save your changes before upgrading",
  );
  // Save the original title; preview always uses the saved server revision.
  await user
    .getByLabel("Title", { exact: false })
    .fill(initial.data.requestTitle);
  await saveDraft(user);
  await history(user)
    .getByRole("button", { name: "Preview upgrade", exact: true })
    .click();
  const preview = user.getByRole("region", {
    name: "Migration preview",
    exact: true,
  });
  await expect(preview).toContainText("amount: Changed");
  await expect(preview).toContainText("obsolete: Removed");
  await expect(preview).toContainText("contact: This field is required.");
  await expect(preview.getByLabel("Contact", { exact: false })).toBeEnabled();
  await expect(preview.getByRole("checkbox")).toBeDisabled();
  await user.screenshot({
    path: "test-results/draft-upgrade-preview.png",
    fullPage: true,
  });
  await expect(
    user.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeDisabled();
  await preview
    .getByRole("button", { name: "Cancel preview", exact: true })
    .click();
  await expect(user.getByLabel("Amount", { exact: false })).toHaveValue("5");
  await expect(user.getByLabel("Obsolete", { exact: false })).toHaveValue(
    "Keep this old data",
  );
  expect(
    (await (await user.request.get(`/api/requests/${initial.id}`)).json())
      .formVersion,
  ).toBe(1);
  await history(user)
    .getByRole("button", { name: "Preview upgrade", exact: true })
    .click();
  await correctPreview(user);
  await confirmPreview(user);
  await expect(user.getByLabel("Contact", { exact: false })).toBeVisible();
  await expect(user.getByLabel("Amount", { exact: false })).toHaveValue("2");
  await expect(user.getByLabel("Obsolete", { exact: false })).toHaveCount(0);
  await expect(
    user.getByRole("region", { name: "Activity", exact: true }),
  ).toContainText("Draft upgraded");
  await user
    .getByRole("button", { name: "Remove restore.txt", exact: true })
    .click();
  await saveDraft(user);
  await user.reload();
  await history(user)
    .getByLabel("Saved revision", { exact: true })
    .selectOption("1");
  await history(user)
    .getByRole("button", { name: "Preview restore", exact: true })
    .click();
  await expect(
    user.getByRole("region", { name: "Migration preview", exact: true }),
  ).toContainText("restore.txt");
  await confirmPreview(user);
  await expect(user.getByLabel("Amount", { exact: false })).toHaveValue("5");
  await expect(user.getByLabel("Obsolete", { exact: false })).toHaveValue(
    "Keep this old data",
  );
  await expect(user.getByLabel("Contact", { exact: false })).toHaveCount(0);
  await expect(
    user.getByRole("button", { name: "View file: restore.txt", exact: true }),
  ).toBeVisible();
  await expect(
    user.getByRole("region", { name: "Activity", exact: true }),
  ).toContainText("Draft restored");
  await user.screenshot({
    path: "test-results/draft-restored.png",
    fullPage: true,
  });
  await user
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(
    user.getByRole("status").filter({ hasText: "Request submitted." }),
  ).toBeVisible();
  await expect(history(user)).toHaveCount(0);
  await setup.publishNext();
  await user.reload();
  await expect(user.getByLabel("Amount", { exact: false })).toHaveValue("5");
  await expect(user.getByLabel("Amount", { exact: false })).toBeDisabled();
  const final = await (
    await user.request.get(`/api/requests/${initial.id}`)
  ).json();
  expect(final.formVersion).toBe(1);
  expect(final.data).toEqual(initial.data);
  expect(final.attachments).toEqual(initial.attachments);
  await context.close();
});
