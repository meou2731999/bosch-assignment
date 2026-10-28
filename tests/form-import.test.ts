import { expect, it } from "vitest";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { importFormDefinition } from "../shared/form-import";
import { createFormStore } from "../server/forms/store";
import { validateRequestData } from "../server/requests/validate-data";
const sample = JSON.parse(readFileSync("forms/request.v1.json", "utf8"));
it("imports Form.io components and derives conditional server validation", () => {
  const { definition, fields } = importFormDefinition(sample);
  expect(definition).toEqual(sample);
  const form = { fields, validationProfile: "blank" as const };
  expect(() =>
    validateRequestData(form, { requestType: "equipment" }, true),
  ).toThrow();
  const data = {
    requestTitle: "New computer",
    requestType: "equipment",
    equipment: "laptop",
    quantity: 1,
    reason: "Needed for daily work",
  };
  expect(validateRequestData(form, data, true)).toEqual(data);
  expect(() =>
    validateRequestData(form, { ...data, quantity: 26 }, true),
  ).toThrow();
});
it.each([
  { ...sample, components: [] },
  {
    ...sample,
    components: [{ ...sample.components[0], calculateValue: "value = 1" }],
  },
  { ...sample, components: [{ ...sample.components[0], type: "unknown" }] },
  { ...sample, components: [sample.components[0], sample.components[0]] },
  {
    ...sample,
    components: [
      {
        ...sample.components[0],
        conditional: { show: true, when: "missing", eq: "yes" },
      },
    ],
  },
])("rejects invalid or unsupported definitions", (raw) => {
  expect(() => importFormDefinition(raw)).toThrow();
});
it("persists uploaded definitions, validates them on the server and pins published versions", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "import-form-"));
  try {
    const store = createFormStore(dir, process.cwd());
    const created = store.create(
      {
        revision: 0,
        name: "Uploaded request",
        description: "",
        template: "blank",
        uploadedDefinition: sample,
      },
      "admin",
    );
    store.publish(created.id, { revision: 1 }, "admin");
    const changed = structuredClone(sample);
    changed.components[0].label = "Updated title";
    store.save(
      created.id,
      { ...store.get(created.id).draft, uploadedDefinition: changed },
      "admin",
    );
    store.publish(created.id, { revision: 3 }, "admin");
    const reopened = createFormStore(dir, "/missing-source-directory");
    expect(
      reopened.published(created.id, 1).definition.components[0].label,
    ).toBe("Request title");
    expect(reopened.published(created.id).definition.components[0].label).toBe(
      "Updated title",
    );
    expect(reopened.published(created.id).fields).toHaveLength(7);
    expect(() =>
      store.create(
        {
          ...created.draft,
          revision: 0,
          uploadedDefinition: { components: [] },
        },
        "admin",
      ),
    ).toThrow("Invalid or unsupported");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
