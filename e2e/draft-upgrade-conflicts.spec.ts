import { test, expect } from "@playwright/test";
import { prepareRequester } from "./helpers/field-builder";
import {
  upgradeForm,
  saveDraft,
  history,
  confirmPreview,
  correctPreview,
} from "./helpers/draft-upgrades";
test("stale upgrade preview fails after publication and concurrent save; explicit reload recovers", async ({
  page,
  browser,
  baseURL,
}) => {
  const setup = await upgradeForm(page, "Upgrade conflicts");
  const context = await browser.newContext({ baseURL });
  const user = await context.newPage();
  await prepareRequester(page, user, setup.form.draft.name);
  await user.getByLabel("Title", { exact: false }).fill("Concurrent upgrade");
  await user.getByLabel("Amount", { exact: false }).fill("2");
  await saveDraft(user);
  const initial = (await (await user.request.get("/api/requests")).json())[0];
  await setup.publishNext();
  await history(user)
    .getByRole("button", { name: "Refresh versions", exact: true })
    .click();
  await history(user)
    .getByRole("button", { name: "Preview upgrade", exact: true })
    .click();
  await correctPreview(user);
  await setup.publishNext();
  await confirmPreview(user);
  await expect(history(user).getByRole("alert")).toContainText(
    "latest published version",
  );
  await history(user)
    .getByRole("button", { name: "Reload request", exact: true })
    .click();
  await expect(history(user)).toContainText("Latest published version: 3");
  await history(user)
    .getByRole("button", { name: "Preview upgrade", exact: true })
    .click();
  await correctPreview(user);
  const session = await (await user.request.get("/api/auth/session")).json();
  const headers = {
    "x-csrf-token": session.csrfToken,
    "x-requested-with": "RequestDesk",
  };
  const concurrent = await user.request.put(`/api/requests/${initial.id}`, {
    headers,
    data: {
      revision: initial.revision,
      formId: initial.formId,
      formVersion: 1,
      action: "draft",
      data: { ...initial.data, requestTitle: "Server changed title" },
      attachments: [],
    },
  });
  expect(concurrent.status()).toBe(200);
  await confirmPreview(user);
  await expect(history(user).getByRole("alert")).toContainText(
    "newer revision",
  );
  await expect(user.getByLabel("Title", { exact: false })).toHaveValue(
    "Concurrent upgrade",
  );
  await user.screenshot({
    path: "test-results/draft-upgrade-conflict.png",
    fullPage: true,
  });
  await history(user)
    .getByRole("button", { name: "Reload request", exact: true })
    .click();
  await expect(user.getByLabel("Title", { exact: false })).toHaveValue(
    "Server changed title",
  );
  await history(user)
    .getByRole("button", { name: "Preview upgrade", exact: true })
    .click();
  await correctPreview(user);
  await confirmPreview(user);
  await expect(user.getByLabel("Contact", { exact: false })).toBeVisible();
  await expect(user.getByLabel("Title", { exact: false })).toHaveValue(
    "Server changed title",
  );
  await context.close();
});
