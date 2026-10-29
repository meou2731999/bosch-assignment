import { inspectOtherPreviews } from "./helpers/attachment-previews";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { login } from "./helpers/field-builder";
import { actor, software, openPreview } from "./helpers/request-actors";
test("attachments preview/download, submit, reject and approve with read-only audit", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, "admin@example.test", "e2e-admin-password");
  await expect(
    page.getByRole("heading", { name: "Manage users", exact: true }),
  ).toBeVisible();
  const requester = await actor(page, browser, baseURL, "requester"),
    reviewer = await actor(page, browser, baseURL, "reviewer");
  try {
    const user = requester.page,
      review = reviewer.page;
    const runtimeErrors: string[] = [];
    for (const target of [user, review])
      target.on("pageerror", (error) => runtimeErrors.push(error.message));
    await software(user, "Browser attachment review");
    await user.locator('input[type="file"]').setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Synthetic attachment for browser review."),
    });
    await expect(
      user.getByRole("button", { name: "View file: notes.txt", exact: true }),
    ).toBeVisible();
    const preview = await openPreview(user, "notes.txt");
    await expect(preview).toContainText(
      "Synthetic attachment for browser review.",
    );
    const download = user.waitForEvent("download");
    await preview.getByRole("link", { name: "Download", exact: true }).click();
    const downloaded = await download;
    expect(downloaded.suggestedFilename()).toBe("notes.txt");
    expect(await readFile((await downloaded.path())!, "utf8")).toBe(
      "Synthetic attachment for browser review.",
    );
    await preview
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await user.locator('input[type="file"]').setInputFiles({
      name: "remove.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Disposable file"),
    });
    await user
      .getByRole("button", { name: "Remove remove.txt", exact: true })
      .click();
    await expect(
      user.getByRole("button", { name: "View file: remove.txt", exact: true }),
    ).toHaveCount(0);
    await inspectOtherPreviews(user);
    await user
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      user.getByRole("status").filter({ hasText: "Request submitted." }),
    ).toBeVisible();
    await expect(
      user.getByRole("button", { name: "Save draft", exact: true }),
    ).toHaveCount(0);
    await expect(user.locator('input[type="file"]')).toHaveCount(0);
    await expect(
      user.getByRole("combobox", { name: "Application", exact: false }),
    ).toHaveValue("analytics");
    await expect(
      user.getByLabel("Access duration (days)", { exact: false }),
    ).toHaveValue("30");
    await expect(
      user.getByLabel("Access duration (days)", { exact: false }),
    ).toBeVisible();
    await review.reload();
    await review
      .getByRole("row")
      .filter({
        has: review.getByRole("cell", {
          name: "Browser attachment review",
          exact: true,
        }),
      })
      .click();
    await expect(
      review.getByRole("button", { name: "Save draft", exact: true }),
    ).toHaveCount(0);
    const inspected = await openPreview(review, "notes.txt");
    await expect(inspected).toContainText(
      "Synthetic attachment for browser review.",
    );
    await inspected
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await review
      .getByRole("button", { name: "Reject request", exact: true })
      .click();
    await expect(review.getByRole("alert")).toContainText(
      "Enter a reason before rejecting",
    );
    await review
      .getByLabel("Review comment", { exact: true })
      .fill("Please clarify the business need.");
    await review
      .getByRole("button", { name: "Reject request", exact: true })
      .click();
    await expect(
      review.getByRole("status").filter({ hasText: "Request rejected." }),
    ).toBeVisible();
    await expect(
      review.getByRole("button", { name: "Approve request", exact: true }),
    ).toHaveCount(0);
    await user.reload();
    await expect(
      user.getByRole("region", { name: "Activity", exact: true }),
    ).toContainText("Please clarify the business need.");
    await expect(
      user.getByRole("button", { name: "Submit request", exact: true }),
    ).toHaveCount(0);
    await user
      .getByRole("button", { name: "Back to requests", exact: true })
      .click();
    await user
      .getByRole("button", { name: "New request", exact: true })
      .click();
    await software(user, "Browser approval flow");
    await user
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      user.getByRole("status").filter({ hasText: "Request submitted." }),
    ).toBeVisible();
    await review
      .getByRole("button", { name: "Back to requests", exact: true })
      .click();
    await review
      .getByRole("row")
      .filter({
        has: review.getByRole("cell", {
          name: "Browser approval flow",
          exact: true,
        }),
      })
      .click();
    await review
      .getByLabel("Review comment", { exact: true })
      .fill("Approved for reporting.");
    await review
      .getByRole("button", { name: "Approve request", exact: true })
      .click();
    await expect(
      review.getByRole("status").filter({ hasText: "Request approved." }),
    ).toBeVisible();
    await expect(
      review.getByRole("region", { name: "Activity", exact: true }),
    ).toContainText("Approved for reporting.");
    expect(runtimeErrors).toEqual([]);
    await review.screenshot({
      path: "test-results/review-approved.png",
      fullPage: true,
    });
  } finally {
    await requester.context.close();
    await reviewer.context.close();
  }
});
