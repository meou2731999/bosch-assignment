import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { formsFixture } from "./helpers/forms-api";
import type { BasicField } from "../shared/fields";
import { validateFields } from "../shared/field-validation";
const { send, grant, input, start, stop } = formsFixture();
const fields: BasicField[] = [
  {
    key: "requestTitle",
    label: "Travel title",
    input: "text",
    dataType: "string",
    required: true,
    minLength: 3,
    maxLength: 80,
  },
  {
    key: "cost",
    label: "Travel cost",
    input: "number",
    dataType: "number",
    required: true,
    min: 1,
    max: 100,
    integer: true,
  },
];
describe("dynamic fields publication and request validation", () => {
  it("persists custom fields, enforces server validation and pins old requests after editing and restart", async () => {
    const response = await send("/admin/forms", "admin", "POST", {
      revision: 0,
      name: "Travel",
      description: "Custom fields",
      template: "request-v2",
      fields,
    });
    expect(response.status).toBe(201);
    const form = await response.json();
    expect(
      (
        await send(`/admin/forms/${form.id}/publish`, "admin", "POST", {
          revision: 1,
        })
      ).status,
    ).toBe(200);
    await grant("alex", { [form.id]: ["create"] });
    const schema = await (await send(`/forms/${form.id}`, "alex")).json();
    expect(schema.fields).toEqual(fields);
    expect(
      schema.definition.components.map((field: { key: string }) => field.key),
    ).toEqual(["requestTitle", "cost"]);
    const id = randomUUID();
    const draft = await send(`/requests/${id}`, "alex", "PUT", input(form.id));
    expect(draft.status).toBe(201);
    const invalid = { requestTitle: "ok", cost: "10" };
    const rejected = await send(
      `/requests/${id}`,
      "alex",
      "PUT",
      input(form.id, { revision: 1, action: "submit", data: invalid }),
    );
    expect(rejected.status).toBe(422);
    expect((await rejected.json()).fields).toEqual(
      validateFields(fields, invalid, true).errors,
    );
    const valid = {
      requestTitle: "Trip report",
      cost: 50,
      unexpected: "discard",
    };
    const saved = await send(
      `/requests/${id}`,
      "alex",
      "PUT",
      input(form.id, { revision: 1, data: valid }),
    );
    expect(saved.status).toBe(200);
    expect((await saved.json()).data).toEqual({
      requestTitle: "Trip report",
      cost: 50,
    });
    const updated = await send(
      `/admin/forms/${form.id}/draft`,
      "admin",
      "PUT",
      {
        ...form.draft,
        revision: 2,
        fields: [fields[0], { ...fields[1], max: 10 }],
      },
    );
    expect(updated.status).toBe(200);
    expect(
      (
        await send(`/admin/forms/${form.id}/publish`, "admin", "POST", {
          revision: 3,
        })
      ).status,
    ).toBe(200);
    const v2 = await send(
      `/requests/${randomUUID()}`,
      "alex",
      "PUT",
      input(form.id, { formVersion: 2, data: valid }),
    );
    expect(v2.status).toBe(422);
    expect(
      (
        await send(
          `/requests/${id}`,
          "alex",
          "PUT",
          input(form.id, { revision: 2, action: "submit", data: valid }),
        )
      ).status,
    ).toBe(200);
    await stop();
    await start();
    expect(
      (await (await send(`/forms/${form.id}/versions/1`, "alex")).json())
        .fields[1].max,
    ).toBe(100);
    expect(
      (await (await send(`/forms/${form.id}`, "alex")).json()).fields[1].max,
    ).toBe(10);
    expect(
      (await (await send(`/requests/${id}`, "alex")).json()).data.cost,
    ).toBe(50);
  });
  it("rejects unsafe or malformed authored schemas and still restricts authoring to admins", async () => {
    const draft = {
      revision: 0,
      name: "Bad fields",
      description: "",
      template: "request-v2",
      fields,
    };
    expect((await send("/admin/forms", "alex", "POST", draft)).status).toBe(
      403,
    );
    for (const bad of [
      [fields[0], fields[0]],
      [{ ...fields[0], custom: "return true" }],
      [{ ...fields[1], dataType: "string" }],
      [],
      [{ ...fields[0], key: "__proto__" }],
    ])
      expect(
        (await send("/admin/forms", "admin", "POST", { ...draft, fields: bad }))
          .status,
      ).toBe(422);
  });
});
