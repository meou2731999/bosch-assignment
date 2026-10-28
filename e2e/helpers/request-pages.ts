import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

export async function verifyRequestPages(user: Page) {
  user.removeAllListeners("dialog");
  await expect(user).toHaveURL(/\/requests\/[\da-f-]+$/);
  await user
    .getByRole("button", { name: "Back to requests", exact: true })
    .click();
  await expect(user.getByRole("table")).toBeVisible();
  const session = await (await user.request.get("/api/auth/session")).json();
  for (let index = 1; index <= 11; index++) {
    const response = await user.request.put(`/api/requests/${randomUUID()}`, {
      headers: {
        "x-csrf-token": session.csrfToken,
        "x-requested-with": "RequestDesk",
      },
      data: {
        revision: 0,
        formId: "request",
        formVersion: 2,
        action: "draft",
        data: { requestTitle: `Paginated request ${index}` },
        attachments: [],
      },
    });
    expect(response.ok()).toBe(true);
  }
  await user.reload();
  const rows = user.getByRole("table").locator("tbody tr");
  await expect(rows).toHaveCount(10);
  await expect(
    user.getByRole("button", { name: "Previous", exact: true }),
  ).toBeDisabled();
  await user.getByRole("button", { name: "Next", exact: true }).click();
  await expect(rows).toHaveCount(2);
  await expect(
    user.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await user.screenshot({
    path: "test-results/request-table-desktop.png",
    fullPage: true,
  });
  const title = await rows.first().getByRole("button").innerText();
  await rows.first().getByRole("button").click();
  await expect(user).toHaveURL(/\/requests\/[\da-f-]+$/);
  await expect(user.getByRole("table")).toHaveCount(0);
  await expect(user.getByLabel("Request title", { exact: false })).toHaveValue(
    title,
  );
  const detailUrl = user.url();
  await user.reload();
  await expect(user.getByLabel("Request title", { exact: false })).toHaveValue(
    title,
  );
  await user.getByLabel("Request title", { exact: false }).fill("Unsaved edit");
  await expect(
    user.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  user.once("dialog", (dialog) => dialog.dismiss());
  await user.evaluate(() => window.history.back());
  await expect(user).toHaveURL(detailUrl);
  await expect(user.getByLabel("Request title", { exact: false })).toHaveValue(
    "Unsaved edit",
  );
  user.once("dialog", (dialog) => dialog.accept());
  await user.evaluate(() => window.history.back());
  await expect(user).toHaveURL(/\/requests$/);
  await expect(rows).toHaveCount(10);
  await user.goForward();
  await expect(user.getByLabel("Request title", { exact: false })).toHaveValue(
    title,
  );
  await user
    .getByRole("button", { name: "Back to requests", exact: true })
    .click();
  await user.setViewportSize({ width: 390, height: 844 });
  await expect(
    user.getByRole("button", { name: "Next", exact: true }),
  ).toBeVisible();
  expect(
    await user.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await user.screenshot({
    path: "test-results/request-table-mobile.png",
    fullPage: true,
  });
  await user.getByRole("button", { name: "New request", exact: true }).click();
  await user
    .getByLabel("Request title", { exact: false })
    .fill("New page draft");
  await user.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(user).toHaveURL(/\/requests\/[\da-f-]+$/);
  await user.reload();
  await expect(user.getByLabel("Request title", { exact: false })).toHaveValue(
    "New page draft",
  );
  await user.goto("/requests/missing-request");
  await expect(user.getByRole("alert")).toBeVisible();
  await expect(
    user.getByRole("button", { name: "Back to requests", exact: true }),
  ).toBeEnabled();
}
