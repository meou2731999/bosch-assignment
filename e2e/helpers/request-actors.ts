import { expect, type Page, type Browser } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { login } from "./field-builder";
export async function actor(
  admin: Page,
  browser: Browser,
  baseURL: string | undefined,
  role: "requester" | "reviewer",
  formId = "request",
) {
  const session = await (await admin.request.get("/api/auth/session")).json();
  const headers = {
    "x-csrf-token": session.csrfToken,
    "x-requested-with": "RequestDesk",
  };
  const email = `${role}-${randomUUID()}@example.test`,
    initial = "flow-initial-password",
    password = "flow-changed-password";
  const created = await admin.request.post("/api/admin/users", {
    headers,
    data: {
      email,
      password: initial,
      name: `Flow ${role}`,
      department: "Test",
      role,
    },
  });
  expect(created.status()).toBe(201);
  const account = await created.json();
  expect(
    (
      await admin.request.put(
        `/api/admin/users/${account.id}/form-permissions`,
        {
          headers,
          data: {
            revision: 0,
            formPermissions: {
              [formId]: role === "reviewer" ? ["review"] : ["create"],
            },
          },
        },
      )
    ).status(),
  ).toBe(200);
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const first = await context.request.post("/api/auth/login", {
    headers: { "x-requested-with": "RequestDesk" },
    data: { email, password: initial },
  });
  expect(first.status()).toBe(200);
  const auth = await first.json();
  expect(
    (
      await context.request.post("/api/auth/change-password", {
        headers: {
          "x-requested-with": "RequestDesk",
          "x-csrf-token": auth.csrfToken,
        },
        data: { currentPassword: initial, password },
      })
    ).status(),
  ).toBe(204);
  await login(page, email, password);
  return { page, context };
}
export async function software(page: Page, title: string) {
  await page.getByLabel("Request title", { exact: false }).fill(title);
  await page
    .getByRole("radio", { name: "Software access", exact: true })
    .check();
  await page
    .getByRole("combobox", { name: "Application", exact: false })
    .selectOption("analytics");
  await page.getByLabel("Access duration (days)", { exact: false }).fill("30");
  await page
    .getByLabel("Business reason", { exact: false })
    .fill("Required for the quarterly reporting process.");
}
export async function openPreview(page: Page, name: string) {
  await page
    .getByRole("button", { name: `View file: ${name}`, exact: true })
    .click();
  return page.getByRole("dialog", { name, exact: true });
}
