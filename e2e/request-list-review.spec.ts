import { expect, test } from "@playwright/test";
import { actor, software } from "./helpers/request-actors";
import { login } from "./helpers/field-builder";

test("reviewer approves a request from its list actions", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users", exact: true }),
  ).toBeVisible();
  const requester = await actor(page, browser, baseURL, "requester");
  const reviewer = await actor(page, browser, baseURL, "reviewer");
  try {
    const title = "Inline approval flow";
    await software(requester.page, title);
    await requester.page
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      requester.page
        .getByRole("status")
        .filter({ hasText: "Request submitted." }),
    ).toBeVisible();

    await reviewer.page.reload();
    const row = reviewer.page.getByRole("row").filter({
      has: reviewer.page.getByRole("cell", { name: title, exact: true }),
    });
    await row.getByRole("button", { name: /^Actions:/ }).click();
    await expect(
      reviewer.page.getByRole("menu", { name: /Inline approval flow/ }),
    ).toContainText("Approve");
    await reviewer.page
      .getByRole("menuitem", { name: "Approve request", exact: true })
      .click();
    await expect(row).toContainText("Approved");
    await reviewer.page.screenshot({
      path: "test-results/request-table-current.png",
    });
  } finally {
    await requester.context.close();
    await reviewer.context.close();
  }
});
