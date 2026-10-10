import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { draftFixture, newFields, validData } from "./helpers/draft-upgrades";
const f = draftFixture();
it("rejects a stale restore preview after another restore and keeps all snapshots", async () => {
  const form = await f.create(),
    id = randomUUID();
  await f.draft(form, id);
  await f.publishFields(form, newFields);
  const preview = await (await f.preview(id, 1, 2, validData)).json();
  await f.apply(id, preview.token);
  const restore = await (
    await f.send(`/requests/${id}/restore/preview`, "alex", "POST", {
      revision: 2,
      snapshotRevision: 1,
    })
  ).json();
  const body = {
    revision: 2,
    snapshotRevision: 1,
    token: restore.token,
    confirm: true,
  };
  expect(
    (await f.send(`/requests/${id}/restore`, "alex", "POST", body)).status,
  ).toBe(200);
  expect(
    (await f.send(`/requests/${id}/restore`, "alex", "POST", body)).status,
  ).toBe(409);
  expect(
    await (await f.send(`/requests/${id}/snapshots`, "alex")).json(),
  ).toHaveLength(3);
});
