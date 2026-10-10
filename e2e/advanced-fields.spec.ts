import { test, expect } from "@playwright/test";
import { prepareRequester } from "./helpers/field-builder";
import { advancedEditor } from "./helpers/advanced-editor";
import { validateFields } from "../shared/field-validation";
test("advanced editor and request render share nested visibility and API validation", async ({
  page,
  browser,
  baseURL,
}) => {
  const { form, saved, headers } = await advancedEditor(page);
  const context = await browser.newContext({ baseURL });
  const requester = await context.newPage();
  await prepareRequester(page, requester, "Advanced collections");
  await requester.getByLabel("Title", { exact: false }).fill("Nested browser");
  await requester
    .getByLabel("Tags", { exact: false })
    .selectOption(["urgent", "normal"]);
  await requester.getByLabel("Enabled", { exact: true }).check();
  const people = requester.getByRole("group", { name: "People", exact: true });
  await people.getByRole("button", { name: "Add row", exact: true }).click();
  await people.getByLabel("Name", { exact: false }).fill("Alex");
  await people.getByLabel("Needs note", { exact: true }).check();
  await expect(people.getByLabel("Row note", { exact: false })).toBeVisible();
  await people.getByLabel("Row note", { exact: false }).fill("a");
  const items = requester.getByRole("group", { name: "Items", exact: true });
  await items.getByRole("button", { name: "Add row", exact: true }).click();
  await expect(items.getByRole("table")).toBeVisible();
  await items.getByLabel("Quantity", { exact: false }).fill("0");
  await requester
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(requester.getByRole("alert")).toContainText(
    "Minimum length: 3.",
  );
  await expect(requester.getByRole("alert")).toContainText("Minimum: 1.");
  const auth = await (await requester.request.get("/api/auth/session")).json();
  const raw = {
    requestTitle: "Nested browser",
    tags: ["urgent", "normal"],
    details: {
      enabled: true,
      people: [{ name: "Alex", needs: true, note: "a" }],
    },
    items: [{ quantity: 0 }],
  };
  const rejected = await requester.request.put("/api/requests/nested-bypass", {
    headers: { ...headers, "x-csrf-token": auth.csrfToken },
    data: {
      revision: 0,
      formId: form.id,
      formVersion: 1,
      action: "submit",
      data: raw,
      attachments: [],
    },
  });
  expect(rejected.status()).toBe(422);
  expect((await rejected.json()).fields).toEqual(
    validateFields(saved.draft.fields, raw, true).errors,
  );
  await requester.getByLabel("Enabled", { exact: true }).uncheck();
  await expect(people.getByLabel("Row note", { exact: false })).toHaveCount(0);
  await items.getByLabel("Quantity", { exact: false }).fill("2");
  await people.getByRole("button", { name: "Add row", exact: true }).click();
  await people.getByLabel("Name", { exact: false }).nth(1).fill("Sam");
  await expect(people.getByLabel("Row note", { exact: false })).toHaveCount(0);
  await requester.getByLabel("Enabled", { exact: true }).check();
  await expect(people.getByLabel("Row note", { exact: false })).toHaveCount(1);
  await people.getByLabel("Row note", { exact: false }).fill("Valid note");
  await requester.getByLabel("Tags", { exact: false }).selectOption(["normal"]);
  await expect(people.getByLabel("Row note", { exact: false })).toHaveCount(0);
  await requester.getByLabel("Title", { exact: false }).fill("Override");
  await expect(people.getByLabel("Row note", { exact: false })).toHaveCount(1);
  await requester.getByLabel("Enabled", { exact: true }).uncheck();
  await people
    .getByRole("button", { name: "Remove row", exact: true })
    .last()
    .click();
  await requester
    .getByRole("button", { name: "Save draft", exact: true })
    .click();
  await expect(
    requester.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
  const requests = await (await requester.request.get("/api/requests")).json();
  const record = requests.find(
    (entry: { formId: string }) => entry.formId === form.id,
  );
  expect(record.data.details.people).toEqual([{ name: "Alex", needs: true }]);
  expect(record.data.tags).toEqual(["normal"]);
  await requester.reload();
  await requester.getByRole("button").filter({ hasText: "Override" }).click();
  await expect(requester.getByLabel("Quantity", { exact: false })).toHaveValue(
    "2",
  );
  await expect(requester.getByLabel("Row note", { exact: false })).toHaveCount(
    0,
  );
  await requester
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(
    requester.getByRole("status").filter({ hasText: "Request submitted." }),
  ).toBeVisible();
  await expect(
    requester.getByLabel("Quantity", { exact: false }),
  ).toBeDisabled();
  await requester.screenshot({
    path: "test-results/advanced-request.png",
    fullPage: true,
  });
  await context.close();
});
