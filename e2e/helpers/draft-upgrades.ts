import { expect, type Page } from "@playwright/test";
import { login } from "./field-builder";
import { oldFields, newFields } from "../../tests/fixtures/draft-upgrades";
import type { FormRecord } from "../../shared/forms";
export async function upgradeForm(page: Page, name: string) {
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
      name,
      description: "Upgrade browser test",
      template: "request-v2",
      fields: oldFields,
    },
  });
  expect(created.status()).toBe(201);
  let form: FormRecord = await created.json();
  const published = await page.request.post(
    `/api/admin/forms/${form.id}/publish`,
    { headers, data: { revision: form.draft.revision } },
  );
  expect(published.status()).toBe(200);
  form = await published.json();
  async function publishNext() {
    const response = await page.request.put(
      `/api/admin/forms/${form.id}/draft`,
      { headers, data: { ...form.draft, fields: newFields } },
    );
    expect(response.status()).toBe(200);
    form = await response.json();
    const next = await page.request.post(
      `/api/admin/forms/${form.id}/publish`,
      { headers, data: { revision: form.draft.revision } },
    );
    expect(next.status()).toBe(200);
    form = await next.json();
    return form;
  }
  return {
    get form() {
      return form;
    },
    publishNext,
  };
}
export async function saveDraft(page: Page) {
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Draft saved." }),
  ).toBeVisible();
}
export function history(page: Page) {
  return page.getByRole("region", {
    name: "Draft versions and snapshots",
    exact: true,
  });
}
export async function confirmPreview(page: Page) {
  const preview = page.getByRole("region", {
    name: "Migration preview",
    exact: true,
  });
  await expect(
    preview.getByRole("button", {
      name: "Apply confirmed change",
      exact: true,
    }),
  ).toBeDisabled();
  await preview
    .getByLabel("I have reviewed the changes and agree to apply them.", {
      exact: true,
    })
    .check();
  await preview
    .getByRole("button", { name: "Apply confirmed change", exact: true })
    .click();
  await expect(preview).toBeHidden();
}

export async function correctPreview(page: Page) {
  const preview = page.getByRole("region", {
    name: "Migration preview",
    exact: true,
  });
  await preview.getByLabel("Amount", { exact: false }).fill("2");
  await preview
    .getByLabel("Contact", { exact: false })
    .fill("team@example.test");
  await preview
    .getByRole("button", { name: "Validate preview changes", exact: true })
    .click();
  await expect(preview.getByRole("checkbox")).toBeEnabled();
}
