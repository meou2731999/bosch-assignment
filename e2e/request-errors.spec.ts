import { test, expect } from "@playwright/test";
import { login } from "./helpers/field-builder";
import { actor, software } from "./helpers/request-actors";
test("conditional fields, locale, unsaved navigation, invalid upload, failed save and revision conflict", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users", exact: true }),
  ).toBeVisible();
  const requester = await actor(page, browser, baseURL, "requester");
  try {
    const user = requester.page;
    await user
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(user.getByRole("alert")).toContainText(
      "Please complete the required fields",
    );
    await user.getByRole("radio", { name: "Equipment", exact: true }).check();
    await expect(user.getByLabel("Quantity", { exact: false })).toBeVisible();
    await user
      .getByRole("combobox", { name: "Equipment", exact: false })
      .selectOption("monitor");
    await user.getByLabel("Quantity", { exact: false }).fill("2");
    await software(user, "Browser recovery flow");
    await expect(user.getByLabel("Quantity", { exact: false })).toBeHidden();
    await user
      .getByRole("combobox", { name: "Language", exact: true })
      .selectOption("vi");
    await expect(
      user.getByRole("button", { name: "Lưu nháp", exact: true }),
    ).toBeVisible();
    await user
      .getByRole("combobox", { name: "Ngôn ngữ", exact: true })
      .selectOption("en");
    await expect(
      user.getByLabel("Request title", { exact: false }),
    ).toHaveValue("Browser recovery flow");
    user.once("dialog", (dialog) => dialog.dismiss());
    await user
      .getByRole("button", { name: "New request", exact: true })
      .click();
    await expect(
      user.getByLabel("Request title", { exact: false }),
    ).toHaveValue("Browser recovery flow");
    await user.locator('input[type="file"]').setInputFiles({
      name: "script.js",
      mimeType: "application/javascript",
      buffer: Buffer.from("bad extension"),
    });
    await expect(
      user
        .getByRole("region", { name: "Attachments", exact: true })
        .getByRole("alert"),
    ).toContainText("Choose up to 3 non-empty");
    await user.locator('input[type="file"]').setInputFiles({
      name: "fake.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("invalid PDF bytes"),
    });
    await expect(
      user
        .getByRole("region", { name: "Attachments", exact: true })
        .getByRole("alert"),
    ).toContainText("must match");
    await user.getByText("Demo controls", { exact: true }).click();
    await user
      .getByLabel("Simulate failure on next save", { exact: true })
      .check();
    await user.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(
      user.getByRole("alert").filter({ hasText: "temporarily unavailable" }),
    ).toBeVisible();
    await expect(
      user.getByLabel("Request title", { exact: false }),
    ).toHaveValue("Browser recovery flow");
    await user.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(
      user.getByRole("status").filter({ hasText: "Draft saved." }),
    ).toBeVisible();
    const records = await (await user.request.get("/api/requests")).json();
    expect(records[0].data).not.toHaveProperty("quantity");
    expect(records[0].data).not.toHaveProperty("equipment");
    const session = await (await user.request.get("/api/auth/session")).json();
    const saved = records[0];
    expect(
      (
        await user.request.put(`/api/requests/${saved.id}`, {
          headers: {
            "x-csrf-token": session.csrfToken,
            "x-requested-with": "RequestDesk",
          },
          data: {
            revision: saved.revision,
            formId: saved.formId,
            formVersion: saved.formVersion,
            action: "draft",
            data: { ...saved.data, additionalNotes: "Saved from another tab" },
            attachments: saved.attachments,
          },
        })
      ).status(),
    ).toBe(200);
    await user
      .getByLabel("Additional notes", { exact: false })
      .fill("Unsaved local notes");
    await user.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(user.getByRole("alert")).toContainText("newer revision");
    await expect(
      user.getByLabel("Additional notes", { exact: false }),
    ).toHaveValue("Unsaved local notes");
    user.once("dialog", (dialog) => dialog.accept());
    await user
      .getByRole("button", { name: "Reload request", exact: true })
      .click();
    await expect(
      user.getByRole("button", { name: "Save draft", exact: true }),
    ).toBeEnabled();
    // Readiness must include hydrated conditional sections, without another wait.
    expect(
      await user
        .getByLabel("Access duration (days)", { exact: false })
        .isVisible(),
    ).toBe(true);
    await expect(
      user.getByLabel("Additional notes", { exact: false }),
    ).toHaveValue("Saved from another tab");
    await expect(
      user.getByRole("combobox", { name: "Application", exact: false }),
    ).toHaveValue("analytics");
    await expect(
      user.getByLabel("Access duration (days)", { exact: false }),
    ).toHaveValue("30");
    await expect(
      user.getByLabel("Access duration (days)", { exact: false }),
    ).toBeVisible();
    await user.screenshot({
      path: "test-results/request-recovery.png",
      fullPage: true,
    });
  } finally {
    await requester.context.close();
  }
});
