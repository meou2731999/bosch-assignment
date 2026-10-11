import { test, expect } from "@playwright/test";
import { login } from "./helpers/field-builder";

test("admin actions use accessible dialogs with recovery, focus and mobile scrolling", async ({
  page,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  const create = page.getByRole("button", { name: "Create user", exact: true });
  await create.click();
  const dialog = page.getByRole("dialog", { name: "Create user", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await dialog.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(create).toBeFocused();
  const row = page.getByRole("row").filter({ hasText: "admin@example.test" });
  const edit = row.getByRole("button", { name: "Edit user", exact: true });
  await edit.click();
  const editDialog = page.getByRole("dialog", {
    name: "Edit user",
    exact: true,
  });
  await editDialog.getByLabel("Name", { exact: true }).fill("Cancelled edit");
  await editDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(edit).toBeFocused();
  await expect(row).toContainText("E2E Admin");
  await expect(row).not.toContainText("Cancelled edit");
  await row
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Reset password", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await row
    .getByRole("button", { name: "Form permissions", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Form permissions", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await create.click();
  await dialog.getByLabel("Name", { exact: true }).fill("Modal recovery");
  await dialog
    .getByLabel("Email", { exact: true })
    .fill("modal-recovery@example.test");
  await dialog.getByLabel("Department", { exact: true }).fill("IT");
  await dialog
    .getByLabel("Initial password", { exact: true })
    .fill("modal-test-password");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/admin/users", async (route) => {
    await pending;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Simulated save failure",
        code: "UNAVAILABLE",
      }),
    });
  });
  await dialog.getByRole("button", { name: "Save user", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Close", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  release();
  await expect(dialog.getByRole("alert")).toContainText(
    "Simulated save failure",
  );
  await expect(dialog.getByLabel("Name", { exact: true })).toHaveValue(
    "Modal recovery",
  );
  await dialog.getByRole("alert").scrollIntoViewIfNeeded();
  const alertBox = await dialog.getByRole("alert").boundingBox();
  const titleBox = await dialog
    .getByRole("heading", { name: "Create user", exact: true })
    .boundingBox();
  expect(alertBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
  await page.screenshot({ path: "test-results/admin-modal-desktop.png" });
  await page.setViewportSize({ width: 390, height: 600 });
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.height).toBeLessThanOrEqual(600);
  await dialog
    .getByRole("button", { name: "Cancel", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    dialog.getByRole("button", { name: "Cancel", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/admin-modal-mobile.png" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.unroute("**/api/admin/users");
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.getByRole("button", { name: "Manage forms", exact: true }).click();
  const createForm = page.getByRole("button", {
    name: "Create form type",
    exact: true,
  });
  await createForm.click();
  await expect(
    page.getByRole("dialog", { name: "Create form type", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(createForm).toBeFocused();
  await page
    .getByRole("button", { name: "Edit form draft", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Edit form draft", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
