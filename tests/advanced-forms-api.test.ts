import { describe, expect, it } from "vitest";
import { formsFixture } from "./helpers/forms-api";
import { advancedFields, advancedData } from "./fixtures/advanced-fields";
import { validateFields } from "../shared/field-validation";
import type { FormRecord } from "../shared/forms";
const f = formsFixture();
describe("advanced published forms through authenticated API", () => {
  it("publishes recursive schemas, enforces shared results, persists and pins old drafts", async () => {
    const created = await f.send("/admin/forms", "admin", "POST", {
      revision: 0,
      name: "Advanced",
      description: "Nested",
      template: "request-v2",
      fields: advancedFields,
    });
    expect(created.status).toBe(201);
    const form: FormRecord = await created.json();
    expect(
      (
        await f.send(`/admin/forms/${form.id}/publish`, "admin", "POST", {
          revision: 1,
        })
      ).status,
    ).toBe(200);
    await f.grant("alex", { [form.id]: ["create"] });
    const raw = advancedData();
    const saved = await f.send(
      "/requests/advanced-draft",
      "alex",
      "PUT",
      f.input(form.id, { data: raw }),
    );
    expect(saved.status).toBe(201);
    const record = await saved.json();
    expect(record.data).toEqual(
      validateFields(advancedFields, raw, false).data,
    );
    const invalid = { ...raw, items: [{ quantity: 0 }], tags: ["spoofed"] };
    const rejected = await f.send(
      "/requests/advanced-invalid",
      "alex",
      "PUT",
      f.input(form.id, { action: "submit", data: invalid }),
    );
    expect(rejected.status).toBe(422);
    expect((await rejected.json()).fields).toEqual(
      validateFields(advancedFields, invalid, true).errors,
    );
    const edit = {
      ...form.draft,
      revision: 2,
      fields: advancedFields.map((field) =>
        field.key === "requestTitle" ? { ...field, minLength: 100 } : field,
      ),
    };
    expect(
      (await f.send(`/admin/forms/${form.id}/draft`, "admin", "PUT", edit))
        .status,
    ).toBe(200);
    expect(
      (
        await f.send(`/admin/forms/${form.id}/publish`, "admin", "POST", {
          revision: 3,
        })
      ).status,
    ).toBe(200);
    await f.stop();
    await f.start();
    const old = await (
      await f.send(`/forms/${form.id}/versions/1`, "alex")
    ).json();
    expect(old.fields).toEqual(advancedFields);
    const submitted = await f.send(
      "/requests/advanced-draft",
      "alex",
      "PUT",
      f.input(form.id, {
        revision: record.revision,
        action: "submit",
        data: record.data,
      }),
    );
    expect(submitted.status).toBe(200);
    expect((await submitted.json()).formVersion).toBe(1);
  });
  it("rejects executable and invalid nested authoring payloads", async () => {
    const fields = [
      {
        ...advancedFields[2],
        fields: [{ ...advancedFields[0], customConditional: "alert(1)" }],
      },
    ];
    expect(
      (
        await f.send("/admin/forms", "admin", "POST", {
          revision: 0,
          name: "Unsafe",
          description: "",
          template: "request-v2",
          fields,
        })
      ).status,
    ).toBe(422);
  });
});
