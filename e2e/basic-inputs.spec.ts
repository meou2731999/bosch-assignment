import { test, expect } from "@playwright/test";
import type { BasicField } from "../shared/fields";
import { login, prepareRequester } from "./helpers/field-builder";
test("all basic inputs render JSON, validate and persist their data types", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("button", { name: "Manage forms", exact: true }),
  ).toBeVisible();
  const session = await (await page.request.get("/api/auth/session")).json();
  const headers = {
    "x-csrf-token": session.csrfToken,
    "x-requested-with": "RequestDesk",
  };
  const fields: BasicField[] = [
    {
      key: "requestTitle",
      label: "Record title",
      input: "text",
      dataType: "string",
      required: true,
    },
    {
      key: "detail",
      label: "Details",
      input: "textarea",
      dataType: "string",
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    {
      key: "email",
      label: "Email contact",
      input: "email",
      dataType: "string",
      required: true,
    },
    {
      key: "number",
      label: "Budget",
      input: "number",
      dataType: "number",
      required: true,
      min: 0,
      max: 10,
    },
    {
      key: "date",
      label: "Meeting date",
      input: "date",
      dataType: "string",
      required: true,
    },
    {
      key: "consent",
      label: "Confirm accuracy",
      input: "checkbox",
      dataType: "boolean",
      required: true,
    },
    {
      key: "choice",
      label: "Priority",
      input: "select",
      dataType: "string",
      required: true,
      options: [
        { label: "Low", value: "low" },
        { label: "High", value: "high" },
      ],
    },
  ];
  const created = await page.request.post("/api/admin/forms", {
    headers,
    data: {
      revision: 0,
      name: "Basic inputs",
      description: "Renderer contract",
      template: "request-v2",
      fields,
    },
  });
  expect(created.status()).toBe(201);
  const form = await created.json();
  expect(
    (
      await page.request.post(`/api/admin/forms/${form.id}/publish`, {
        headers,
        data: { revision: 1 },
      })
    ).status(),
  ).toBe(200);
  const context = await browser.newContext({ baseURL });
  try {
    const user = await context.newPage();
    await prepareRequester(page, user, "Basic inputs");
    await user
      .getByLabel("Record title", { exact: false })
      .fill("Typed record");
    await user.getByLabel("Details", { exact: false }).fill("Short detail");
    await user
      .getByLabel("Email contact", { exact: false })
      .fill("contact@example.test");
    await user.getByLabel("Budget", { exact: false }).fill("1.5");
    await user.getByLabel("Meeting date", { exact: false }).fill("2028-02-29");
    await user.getByLabel("Priority", { exact: false }).selectOption("high");
    await user
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(user.getByRole("alert")).toContainText(
      "This checkbox must be checked.",
    );
    await user.getByLabel("Confirm accuracy", { exact: false }).check();
    await user
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      user.getByRole("status").filter({ hasText: "Request submitted." }),
    ).toBeVisible();
    const records = await (await user.request.get("/api/requests")).json();
    expect(records[0].data).toEqual({
      requestTitle: "Typed record",
      detail: "Short detail",
      email: "contact@example.test",
      number: 1.5,
      date: "2028-02-29",
      consent: true,
      choice: "high",
    });
    await user.reload();
    await expect(user.getByLabel("Meeting date", { exact: false })).toHaveValue(
      "2028-02-29",
    );
    await expect(
      user.getByLabel("Confirm accuracy", { exact: false }),
    ).toBeChecked();
    await expect(user.getByLabel("Priority", { exact: false })).toHaveValue(
      "high",
    );
  } finally {
    await context.close();
  }
});
