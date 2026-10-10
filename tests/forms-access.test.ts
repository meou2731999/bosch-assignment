import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { formsFixture } from "./helpers/forms-api";
const fixture = formsFixture();
const { send, createForm, grant, input, data, upload, sessions } = fixture;
describe("form catalog, publication and server authorization", () => {
  it("scopes own/view/review/create access to the granted form including pending and linked attachments", async () => {
    const a = await createForm("Form A");
    const b = await createForm("Form B");
    await grant("alex", { [a.id]: ["create"] });
    await grant("sam", { [a.id]: ["view"] });
    await grant("morgan", { [a.id]: ["review"] });
    const catalog = await (await send("/forms", "alex")).json();
    expect(catalog.map((form: { id: string }) => form.id)).toEqual([a.id]);
    expect((await send(`/forms/${b.id}`, "alex")).status).toBe(404);
    expect((await send(`/forms/${b.id}/versions/1`, "morgan")).status).toBe(
      404,
    );
    const id = randomUUID();
    expect(
      (await send(`/requests/${id}`, "alex", "PUT", input(b.id))).status,
    ).toBe(403);
    expect((await upload(id, b.id)).status).toBe(403);
    const uploaded = await upload(id, a.id);
    expect(uploaded.status).toBe(201);
    const file = await uploaded.json();
    expect((await send(`/attachments/${file.id}`, "sam")).status).toBe(404);
    const saved = await send(
      `/requests/${id}`,
      "alex",
      "PUT",
      input(a.id, { data, attachments: [file] }),
    );
    expect(saved.status).toBe(201);
    expect((await saved.json()).data.additionalNotes).toBe(
      data.additionalNotes,
    );
    expect((await send(`/requests/${id}`, "sam")).status).toBe(200);
    expect((await send(`/attachments/${file.id}`, "sam")).status).toBe(200);
    expect(
      (
        await send(
          `/requests/${id}`,
          "sam",
          "PUT",
          input(a.id, { revision: 1 }),
        )
      ).status,
    ).toBe(403);
    expect((await upload(id, a.id, "sam")).status).toBe(403);
    expect(
      (
        await send(`/requests/${id}/review`, "sam", "POST", {
          revision: 1,
          decision: "approve",
          comment: "",
        })
      ).status,
    ).toBe(403);
    const submitted = await send(
      `/requests/${id}`,
      "alex",
      "PUT",
      input(a.id, { revision: 1, action: "submit", data, attachments: [file] }),
    );
    expect(submitted.status).toBe(200);
    expect(
      (
        await send(`/requests/${id}/review`, "morgan", "POST", {
          revision: 2,
          decision: "approve",
          comment: "Approved",
        })
      ).status,
    ).toBe(200);
    expect((await send(`/requests/${id}`, "admin")).status).toBe(200);
    expect(
      (await send(`/requests/${randomUUID()}`, "admin", "PUT", input(a.id)))
        .status,
    ).toBe(403);
    const list = await (await send("/requests", "sam")).json();
    expect(
      list.every((record: { formId: string }) => record.formId === a.id),
    ).toBe(true);
    const previousSession = sessions.get("alex")!;
    await grant("alex", {});
    expect(
      (
        await fixture.send("/requests", "anonymous", "GET", undefined, {
          Cookie: previousSession.cookie,
        })
      ).status,
    ).toBe(401);
    expect((await send(`/requests/${id}`, "alex")).status).toBe(404);
    expect((await send(`/attachments/${file.id}`, "alex")).status).toBe(404);
    expect(await (await send("/forms", "alex")).json()).toEqual([]);
    expect(
      (
        await send("/admin/users/alex/form-permissions", "admin", "PUT", {
          revision: 0,
          formPermissions: {},
        })
      ).status,
    ).toBe(409);
  });
});
