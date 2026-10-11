import { test, expect } from "@playwright/test";
import { login } from "./helpers/field-builder";
test("user dropdown closes outside/on Escape and opens password settings", async ({
  page,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  const trigger = page.getByRole("button", { name: /^User menu:/ });
  const password = page.getByRole("button", {
    name: "Change password",
    exact: true,
  });
  await expect(page.getByLabel("Language", { exact: true })).toHaveCount(0);
  await expect(password).toHaveCount(0);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.getByLabel("Language", { exact: true }).selectOption("vi");
  await expect(page.getByLabel("Ngôn ngữ", { exact: true })).toHaveValue("vi");
  await page.getByLabel("Ngôn ngữ", { exact: true }).selectOption("en");
  await password.focus();
  await page.keyboard.press("Escape");
  await expect(password).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("heading", { name: "Manage users", exact: true })
    .click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await page.screenshot({
    path: "test-results/user-menu-mobile.png",
    fullPage: true,
  });
  const menu = await password.boundingBox();
  expect(menu!.x).toBeGreaterThanOrEqual(0);
  expect(menu!.x + menu!.width).toBeLessThanOrEqual(390);
  await password.click();
  await expect(
    page.getByRole("heading", { name: "Change password", exact: true }),
  ).toBeVisible();
});
