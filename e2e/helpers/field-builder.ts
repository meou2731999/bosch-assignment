import { expect, type Page, type Locator } from "@playwright/test";
export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
export async function addField(editor: Locator, label: string, input = "text") {
  await editor.getByRole("button", { name: "Add field", exact: true }).click();
  const field = editor.getByRole("group", { name: /^Fields \d+$/ }).last();
  await field.getByLabel("Field label", { exact: true }).fill(label);
  await field.getByLabel("Input type", { exact: true }).selectOption(input);
  return field;
}
export async function publish(page: Page, name: string, version: number) {
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: /^Actions:/ }).click();
  await row
    .getByRole("menuitem", { name: "Publish form", exact: true })
    .click();
  await expect(row).toContainText(`Published version: ${version}`);
  return row;
}
export async function prepareRequester(
  admin: Page,
  userPage: Page,
  formName: string,
) {
  const session = await (await admin.request.get("/api/auth/session")).json();
  const headers = {
    "x-csrf-token": session.csrfToken,
    "x-requested-with": "RequestDesk",
  };
  const created = await admin.request.post("/api/admin/users", {
    headers,
    data: {
      name: "Builder requester",
      email: `builder-${formName.toLowerCase().replaceAll(" ", "-")}@example.test`,
      department: "Operations",
      role: "requester",
      password: "builder-initial-password",
    },
  });
  expect(created.status()).toBe(201);
  const account = await created.json();
  const forms = await (await admin.request.get("/api/admin/forms")).json();
  const form = forms.find(
    (item: { draft: { name: string } }) => item.draft.name === formName,
  );
  expect(
    (
      await admin.request.put(
        `/api/admin/users/${account.id}/form-permissions`,
        {
          headers,
          data: { revision: 0, formPermissions: { [form.id]: ["create"] } },
        },
      )
    ).status(),
  ).toBe(200);
  const first = await userPage.request.post("/api/auth/login", {
    headers: { "x-requested-with": "RequestDesk" },
    data: { email: account.email, password: "builder-initial-password" },
  });
  expect(first.status()).toBe(200);
  const auth = await first.json();
  expect(
    (
      await userPage.request.post("/api/auth/change-password", {
        headers: {
          "x-csrf-token": auth.csrfToken,
          "x-requested-with": "RequestDesk",
        },
        data: {
          currentPassword: "builder-initial-password",
          password: "builder-changed-password",
        },
      })
    ).status(),
  ).toBe(204);
  await login(userPage, account.email, "builder-changed-password");
  await userPage
    .getByRole("button", { name: "New request", exact: true })
    .click();
}
