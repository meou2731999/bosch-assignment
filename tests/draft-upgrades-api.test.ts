import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  draftFixture,
  newFields,
  oldFields,
  draftData,
  validData,
} from "./helpers/draft-upgrades";
const f = draftFixture();
describe("confirmed draft upgrades and restores", () => {
  it("previews without mutation, preserves snapshots, upgrades and restores exactly across restart", async () => {
    const form = await f.create(),
      id = randomUUID();
    const initial = await f.draft(form, id);
    const published = await f.publishFields(form, newFields);
    const response = await f.preview(id);
    expect(response.status).toBe(200);
    let preview = await response.json();
    expect(preview).toMatchObject({
      requestId: id,
      revision: 1,
      fromVersion: 1,
      toVersion: 2,
      operation: "upgrade",
      data: { requestTitle: draftData.requestTitle, amount: 5 },
    });
    expect(preview.submissionErrors).toHaveProperty("contact");
    expect(await (await f.send(`/requests/${id}`, "alex")).json()).toEqual(
      initial,
    );
    const beforeSnapshots = await (
      await f.send(`/requests/${id}/snapshots`, "alex")
    ).json();
    expect(beforeSnapshots).toHaveLength(1);
    expect(beforeSnapshots[0]).not.toHaveProperty("data");
    expect((await f.apply(id, preview.token, 1, 2, preview.data)).status).toBe(
      422,
    );
    preview = await (await f.preview(id, 1, 2, validData)).json();
    const applied = await f.apply(id, preview.token);
    expect(applied.status).toBe(200);
    const next = await applied.json();
    expect(next.formVersion).toBe(2);
    expect(next.revision).toBe(2);
    expect(next.data).toEqual(preview.data);
    expect(next.audit.at(-1)).toMatchObject({
      action: "draft_upgraded",
      actorId: initial.ownerId,
      fromVersion: 1,
      toVersion: 2,
    });
    expect((await f.apply(id, preview.token)).status).toBe(409);
    expect(
      (
        await f.send(
          `/requests/${id}`,
          "alex",
          "PUT",
          f.input(form.id, {
            revision: 2,
            formVersion: 2,
            action: "submit",
            data: { ...next.data, contact: "invalid" },
          }),
        )
      ).status,
    ).toBe(422);
    await f.stop();
    await f.start();
    expect(
      (await (await f.send(`/forms/${form.id}/versions/1`, "alex")).json())
        .fields,
    ).toEqual(oldFields);
    const restoreResponse = await f.send(
      `/requests/${id}/restore/preview`,
      "alex",
      "POST",
      { revision: 2, snapshotRevision: 1 },
    );
    expect(restoreResponse.status).toBe(200);
    const restore = await restoreResponse.json();
    expect(restore.data).toEqual(initial.data);
    expect(restore.toVersion).toBe(1);
    const restored = await f.send(`/requests/${id}/restore`, "alex", "POST", {
      revision: 2,
      snapshotRevision: 1,
      token: restore.token,
      confirm: true,
    });
    expect(restored.status).toBe(200);
    const record = await restored.json();
    expect(record).toMatchObject({
      revision: 3,
      formVersion: 1,
      data: initial.data,
    });
    expect(record.audit.at(-1)).toMatchObject({
      action: "draft_restored",
      snapshotRevision: 1,
      fromVersion: 2,
      toVersion: 1,
    });
    expect(
      (await (await f.send(`/requests/${id}/snapshots`, "alex")).json()).map(
        (item: { revision: number }) => item.revision,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      (await (await f.send(`/forms/${published.id}`, "alex")).json()).version,
    ).toBe(2);
  });
  it("rejects unconfirmed, forged and extra client migration data and never changes revision", async () => {
    const form = await f.create(),
      id = randomUUID();
    await f.draft(form, id);
    await f.publishFields(form, newFields);
    const preview = await (await f.preview(id, 1, 2, validData)).json();
    for (const patch of [
      { confirm: false },
      { token: "bad" },
      { data: { amount: 1 } },
      { formId: "request" },
      { revision: 0 },
      { targetVersion: 1 },
    ]) {
      const result = await f.send(`/requests/${id}/upgrade`, "alex", "POST", {
        revision: 1,
        targetVersion: 2,
        confirm: true,
        token: preview.token,
        ...patch,
      });
      expect([409, 422]).toContain(result.status);
    }
    expect((await f.apply(id, "0".repeat(64))).status).toBe(409);
    const missingConfirm = await f.send(
      `/requests/${id}/upgrade`,
      "alex",
      "POST",
      { revision: 1, targetVersion: 2, token: preview.token },
    );
    expect(missingConfirm.status).toBe(422);
    expect(
      (await (await f.send(`/requests/${id}`, "alex")).json()).revision,
    ).toBe(1);
  });
  it("rejects stale previews after a request save or a newer publication", async () => {
    const form = await f.create(),
      id = randomUUID();
    await f.draft(form, id);
    const second = await f.publishFields(form, newFields);
    const preview = await (await f.preview(id, 1, 2, validData)).json();
    await f.publishFields(second, newFields);
    expect((await f.apply(id, preview.token)).status).toBe(409);
    const latest = await (await f.preview(id, 1, 3, validData)).json();
    expect(
      (
        await f.send(
          `/requests/${id}`,
          "alex",
          "PUT",
          f.input(form.id, { revision: 1, data: { ...draftData, amount: 2 } }),
        )
      ).status,
    ).toBe(200);
    expect((await f.apply(id, latest.token, 1, 3)).status).toBe(409);
    expect((await f.preview(id, 1, 3)).status).toBe(409);
    expect(
      (await (await f.send(`/requests/${id}`, "alex")).json()).formVersion,
    ).toBe(1);
  });
});
