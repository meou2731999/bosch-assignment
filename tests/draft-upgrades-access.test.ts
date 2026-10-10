import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import path from "node:path";
import { draftFixture, newFields, draftData } from "./helpers/draft-upgrades";
const f = draftFixture();
describe("draft migration authorization, files and finality", () => {
  it("restricts history and transitions to owners with create grants, including admins/reviewers", async () => {
    const form = await f.create(),
      id = randomUUID();
    await f.draft(form, id);
    await f.publishFields(form, newFields);
    await f.grant("sam", { [form.id]: ["create", "view"] });
    await f.grant("morgan", { [form.id]: ["review"] });
    for (const user of ["sam", "morgan", "admin"]) {
      expect((await f.send(`/requests/${id}`, user)).status).toBe(200);
      expect(
        await (await f.send(`/requests/${id}`, user)).json(),
      ).not.toHaveProperty("snapshots");
      expect((await f.send(`/requests/${id}/snapshots`, user)).status).toBe(
        404,
      );
      expect(
        (
          await f.send(`/requests/${id}/upgrade/preview`, user, "POST", {
            revision: 1,
            targetVersion: 2,
          })
        ).status,
      ).toBe(404);
      expect(
        (
          await f.send(`/requests/${id}/restore/preview`, user, "POST", {
            revision: 1,
            snapshotRevision: 1,
          })
        ).status,
      ).toBe(404);
    }
    await f.grant("alex", {});
    expect((await f.preview(id)).status).toBe(404);
    expect((await f.send(`/requests/${id}/snapshots`, "alex")).status).toBe(
      404,
    );
  });
  it("locks upgrade, restore and snapshot access for submitted and decided requests without changing schema", async () => {
    const form = await f.create(),
      id = randomUUID();
    await f.draft(form, id);
    await f.publishFields(form, newFields);
    expect(
      (
        await f.send(
          `/requests/${id}`,
          "alex",
          "PUT",
          f.input(form.id, { revision: 1, action: "submit", data: draftData }),
        )
      ).status,
    ).toBe(200);
    for (const route of [
      "upgrade/preview",
      "upgrade",
      "restore/preview",
      "restore",
    ])
      expect(
        (await f.send(`/requests/${id}/${route}`, "alex", "POST", {})).status,
      ).toBe(409);
    expect((await f.send(`/requests/${id}/snapshots`, "alex")).status).toBe(
      409,
    );
    await f.grant("morgan", { [form.id]: ["review"] });
    expect(
      (
        await f.send(`/requests/${id}/review`, "morgan", "POST", {
          revision: 2,
          decision: "approve",
          comment: "Approved",
        })
      ).status,
    ).toBe(200);
    expect((await f.preview(id, 3)).status).toBe(409);
    const record = await (await f.send(`/requests/${id}`, "alex")).json();
    expect(record.formVersion).toBe(1);
    expect(record.data).toEqual(draftData);
    expect(record.status).toBe("approved");
  });
  it("restores removed uploaded attachments and preserves bytes before persisting a transition", async () => {
    const form = await f.create(),
      id = randomUUID();
    const file = await (await f.upload(id, form.id)).json();
    const saved = await f.send(
      `/requests/${id}`,
      "alex",
      "PUT",
      f.input(form.id, { data: draftData, attachments: [file] }),
    );
    expect(saved.status).toBe(201);
    expect(
      (
        await f.send(
          `/requests/${id}`,
          "alex",
          "PUT",
          f.input(form.id, { revision: 1, data: draftData }),
        )
      ).status,
    ).toBe(200);
    const preview = await (
      await f.send(`/requests/${id}/restore/preview`, "alex", "POST", {
        revision: 2,
        snapshotRevision: 1,
      })
    ).json();
    expect(preview.attachments).toEqual([file]);
    const restored = await f.send(`/requests/${id}/restore`, "alex", "POST", {
      revision: 2,
      snapshotRevision: 1,
      token: preview.token,
      confirm: true,
    });
    expect(restored.status).toBe(200);
    expect((await restored.json()).attachments).toEqual([file]);
    expect(await (await f.send(`/attachments/${file.id}`, "alex")).text()).toBe(
      "scoped attachment",
    );
  });
  it("keeps draft and snapshots unchanged if restored attachment bytes are missing", async () => {
    const form = await f.create(),
      id = randomUUID();
    const file = await (await f.upload(id, form.id)).json();
    await f.send(
      `/requests/${id}`,
      "alex",
      "PUT",
      f.input(form.id, { data: draftData, attachments: [file] }),
    );
    await f.send(
      `/requests/${id}`,
      "alex",
      "PUT",
      f.input(form.id, { revision: 1, data: draftData }),
    );
    const original = await (await f.send(`/requests/${id}`, "alex")).json();
    const preview = await (
      await f.send(`/requests/${id}/restore/preview`, "alex", "POST", {
        revision: 2,
        snapshotRevision: 1,
      })
    ).json();
    rmSync(path.join(f.dir, "uploads", `${file.id}.bin`));
    expect(
      (
        await f.send(`/requests/${id}/restore`, "alex", "POST", {
          revision: 2,
          snapshotRevision: 1,
          token: preview.token,
          confirm: true,
        })
      ).status,
    ).toBe(404);
    expect(await (await f.send(`/requests/${id}`, "alex")).json()).toEqual(
      original,
    );
    expect(
      await (await f.send(`/requests/${id}/snapshots`, "alex")).json(),
    ).toHaveLength(2);
  });
  it("does not mutate a draft when a historical snapshot or target version is unavailable", async () => {
    const form = await f.create(),
      id = randomUUID();
    const original = await f.draft(form, id);
    expect(
      (
        await f.send(`/requests/${id}/restore/preview`, "alex", "POST", {
          revision: 1,
          snapshotRevision: 999,
        })
      ).status,
    ).toBe(404);
    expect((await f.preview(id, 1, 999)).status).toBe(404);
    expect(await (await f.send(`/requests/${id}`, "alex")).json()).toEqual(
      original,
    );
  });
});
