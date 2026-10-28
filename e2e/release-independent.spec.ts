import { test, expect } from "@playwright/test";
import { prepareRequester } from "./helpers/field-builder";
import { actor } from "./helpers/request-actors";
import {
  upgradeForm,
  saveDraft,
  history,
  correctPreview,
  confirmPreview,
} from "./helpers/draft-upgrades";
import { bundleManifest, assertServedBundle } from "./helpers/schema-evidence";
import { newFields } from "../tests/fixtures/draft-upgrades";
test("publish and upgrade without frontend release, then submit and review the new schema", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const before = bundleManifest();
  const setup = await upgradeForm(page, "Release independent journey");
  const context = await browser.newContext({ baseURL });
  const requester = await context.newPage();
  const reviewer = await actor(
    page,
    browser,
    baseURL,
    "reviewer",
    setup.form.id,
  );
  try {
    await prepareRequester(page, requester, setup.form.draft.name);
    const runtimeErrors: string[] = [];
    requester.on("pageerror", (error) => runtimeErrors.push(error.message));
    reviewer.page.on("pageerror", (error) => runtimeErrors.push(error.message));
    const timeOrigin = await requester.evaluate(() => performance.timeOrigin);
    await requester
      .getByLabel("Title", { exact: false })
      .fill("Complete release journey");
    await requester.getByLabel("Amount", { exact: false }).fill("5");
    await saveDraft(requester);
    const initial = (
      await (await requester.request.get("/api/requests")).json()
    )[0];
    const published = await setup.publishNext([
      ...newFields,
      {
        key: "handoffReference",
        label: "Handoff reference",
        input: "text",
        dataType: "string",
        required: false,
      },
    ]);
    await requester
      .getByRole("button", { name: "Back to requests", exact: true })
      .click();
    await requester
      .getByRole("button", { name: "New request", exact: true })
      .click();
    await expect(
      requester.getByLabel("Handoff reference", { exact: false }),
    ).toBeVisible();
    await expect(
      requester.getByLabel("Contact", { exact: false }),
    ).toBeVisible();
    await requester
      .getByRole("button", { name: "Back to requests", exact: true })
      .click();
    await requester
      .getByRole("button")
      .filter({ hasText: initial.data.requestTitle })
      .click();
    await expect(
      requester.getByLabel("Handoff reference", { exact: false }),
    ).toHaveCount(0);
    await history(requester)
      .getByRole("button", { name: "Preview upgrade", exact: true })
      .click();
    await correctPreview(requester);
    await confirmPreview(requester);
    await requester
      .getByLabel("Handoff reference", { exact: false })
      .fill("BUSINESS-CONFIG-ONLY");
    await requester
      .getByRole("button", { name: "Submit request", exact: true })
      .click();
    await expect(
      requester.getByRole("status").filter({ hasText: "Request submitted." }),
    ).toBeVisible();
    const submitted = await (
      await requester.request.get(`/api/requests/${initial.id}`)
    ).json();
    expect(submitted).toMatchObject({
      status: "submitted",
      formVersion: 2,
      data: {
        handoffReference: "BUSINESS-CONFIG-ONLY",
        amount: 2,
        contact: "team@example.test",
      },
    });
    await reviewer.page.reload();
    await reviewer.page
      .getByRole("button")
      .filter({ hasText: initial.data.requestTitle })
      .click();
    await expect(
      reviewer.page.getByLabel("Handoff reference", { exact: false }),
    ).toHaveValue("BUSINESS-CONFIG-ONLY");
    await expect(
      reviewer.page.getByLabel("Handoff reference", { exact: false }),
    ).toBeDisabled();
    await reviewer.page
      .getByLabel("Review comment", { exact: true })
      .fill("Schema-only change verified.");
    await reviewer.page
      .getByRole("button", { name: "Approve request", exact: true })
      .click();
    await expect(
      reviewer.page
        .getByRole("status")
        .filter({ hasText: "Request approved." }),
    ).toBeVisible();
    const approved = await (
      await requester.request.get(`/api/requests/${initial.id}`)
    ).json();
    expect(approved.status).toBe("approved");
    expect(approved.data).toEqual(submitted.data);
    expect(approved.formVersion).toBe(2);
    expect(
      approved.audit.map((event: { action: string }) => event.action),
    ).toEqual(["created", "draft_upgraded", "submitted", "approved"]);
    expect(await requester.evaluate(() => performance.timeOrigin)).toBe(
      timeOrigin,
    );
    const after = bundleManifest();
    expect(after).toEqual(before);
    await assertServedBundle(requester, after);
    expect(runtimeErrors).toEqual([]);
    await testInfo.attach("release-independent-schema-evidence", {
      contentType: "application/json",
      body: Buffer.from(
        JSON.stringify(
          {
            formId: setup.form.id,
            versions: [1, published.activeVersion],
            before,
            after,
            sameRequesterDocument: true,
            newField: "handoffReference",
            draftVersion: initial.formVersion,
            submittedVersion: submitted.formVersion,
            approvedVersion: approved.formVersion,
            auditActions: approved.audit.map(
              (event: { action: string }) => event.action,
            ),
          },
          null,
          2,
        ),
      ),
    });
    await reviewer.page.screenshot({
      path: "test-results/release-independent-approved.png",
      fullPage: true,
    });
  } finally {
    await context.close();
    await reviewer.context.close();
  }
});
