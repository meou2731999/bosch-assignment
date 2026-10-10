import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { formsFixture } from "./helpers/forms-api";
const fixture = formsFixture();
const { send, createForm, grant, input, data, upload, start, stop } = fixture;
describe("form catalog, publication and server authorization", () => {
  it("pins requests to their form/version and prevents cross-form file reuse and self-review", async () => {
    const a = await createForm("Pinned A");
    const b = await createForm("Pinned B");
    await grant("alex", { [a.id]: ["create", "review"], [b.id]: ["create"] });
    const id = randomUUID();
    const file = await (await upload(id, a.id)).json();
    expect(
      (
        await send(
          `/requests/${id}`,
          "alex",
          "PUT",
          input(b.id, { attachments: [file] }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await send(`/requests/${id}`, "alex", "PUT", input(a.id, { data })))
        .status,
    ).toBe(201);
    expect(
      (
        await send(
          `/requests/${id}`,
          "alex",
          "PUT",
          input(b.id, { revision: 1 }),
        )
      ).status,
    ).toBe(409);
    expect((await upload(id, b.id)).status).toBe(409);
    const published = await send(
      `/admin/forms/${a.id}/publish`,
      "admin",
      "POST",
      { revision: a.draft.revision },
    );
    expect(published.status).toBe(200);
    expect(
      (
        await send(
          `/requests/${id}`,
          "alex",
          "PUT",
          input(a.id, { revision: 1, formVersion: 2, data }),
        )
      ).status,
    ).toBe(409);
    expect(
      (await send(`/requests/${randomUUID()}`, "alex", "PUT", input(a.id)))
        .status,
    ).toBe(409);
    expect(
      (
        await send(
          `/requests/${id}`,
          "alex",
          "PUT",
          input(a.id, { revision: 1, action: "submit", data }),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await send(`/requests/${id}/review`, "alex", "POST", {
          revision: 2,
          decision: "approve",
          comment: "",
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await send(`/requests/${id}/review`, "admin", "POST", {
          revision: 2,
          decision: "approve",
          comment: "",
        })
      ).status,
    ).toBe(403);
    await stop();
    await start();
    expect(
      (await (await send(`/requests/${id}`, "alex")).json()).formVersion,
    ).toBe(1);
    expect((await (await send(`/forms/${a.id}`, "alex")).json()).version).toBe(
      2,
    );
    expect(
      (await (await send(`/forms/${a.id}/versions/1`, "alex")).json()).version,
    ).toBe(1);
  });
});
