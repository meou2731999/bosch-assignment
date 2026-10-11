import { test, expect } from "@playwright/test";
import { actor } from "./helpers/request-actors";
import { login } from "./helpers/field-builder";

test("unprefixed Tailwind and scoped Bootstrap coexist on desktop and mobile", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users", exact: true }),
  ).toBeVisible();
  const styles = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML =
      '<div><div class="p-4 border rounded-lg"><button class="btn">Outside</button></div></div><div class="formio-surface"><div class="p-4 border rounded-lg"><button class="btn">Inside</button></div></div>';
    document.body.append(host);
    const [outside, inside] = [...host.querySelectorAll(".p-4")].map(
      (element) => {
        const style = getComputedStyle(element);
        return {
          padding: style.paddingTop,
          border: style.borderTopWidth,
          variables: style.getPropertyValue("--bs-body-font-family"),
          buttonPadding: getComputedStyle(element.querySelector("button")!)
            .paddingLeft,
        };
      },
    );
    host.remove();
    return { outside, inside };
  });
  expect(styles.outside.padding).toBe("16px");
  expect(styles.inside.padding).toBe("24px");
  expect(styles.outside.border).toBe("1px");
  expect(styles.outside.variables).toBe("");
  expect(styles.inside.variables).not.toBe("");
  expect(styles.outside.buttonPadding).toBe("0px");
  expect(styles.inside.buttonPadding).not.toBe("0px");
  await expect(page.locator('[class*="tw:"]')).toHaveCount(0);
  const requester = await actor(page, browser, baseURL, "requester");
  try {
    const user = requester.page;
    await expect(
      user.locator(".formio-surface .form-control").first(),
    ).toBeVisible();
    await user.getByRole("button", { name: "Save draft", exact: true }).click();
    const notice = user.getByRole("status").filter({ hasText: "Draft saved." });
    await expect(notice).toBeVisible();
    const noticeBox = await notice.boundingBox();
    const cardBox = await user
      .getByRole("region", { name: "New request", exact: true })
      .boundingBox();
    expect(
      cardBox!.y - noticeBox!.y - noticeBox!.height,
    ).toBeGreaterThanOrEqual(19);
    await user.screenshot({
      path: "test-results/css-isolation-desktop.png",
      fullPage: true,
    });
    await user.setViewportSize({ width: 390, height: 844 });
    const field = user.locator(".formio-surface .form-control").first();
    const bounds = await field.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await user.screenshot({
      path: "test-results/css-isolation-mobile.png",
      fullPage: true,
    });
  } finally {
    await requester.context.close();
  }
});
