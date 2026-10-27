import { expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createFormStore } from "../server/forms/store";
import { validateRequestData } from "../server/requests/validate-data";

it("publishes blank forms with only their own fields and validation, preserving versions", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "blank-form-"));
  try {
    const store = createFormStore(dir, process.cwd());
    const draft = {
      revision: 0,
      name: "Visitor registration",
      description: "",
      template: "blank",
      fields: [
        {
          key: "visitor",
          label: "Visitor name",
          input: "text",
          dataType: "string",
          required: true,
        },
      ],
    };
    expect(() =>
      store.create({ ...draft, fields: undefined }, "admin"),
    ).toThrow("Invalid form draft");
    expect(() => store.create({ ...draft, fields: [] }, "admin")).toThrow(
      "Invalid form draft",
    );
    const created = store.create(draft, "admin");
    store.publish(created.id, { revision: 1 }, "admin");
    const published = store.published(created.id);
    expect(published.validationProfile).toBe("blank");
    expect(published.fields).toEqual(draft.fields);
    expect(published.definition.components.map((field) => field.key)).toEqual([
      "visitor",
    ]);
    expect(
      validateRequestData(
        published,
        { visitor: "An", requestType: "software" },
        true,
      ),
    ).toEqual({ visitor: "An" });
    expect(() => validateRequestData(published, {}, true)).toThrow(
      "highlighted values",
    );
    const saved = store.save(
      created.id,
      { ...draft, revision: 2, name: "Updated registration" },
      "admin",
    );
    store.publish(created.id, { revision: saved.draft.revision }, "admin");
    const reopened = createFormStore(dir, process.cwd());
    expect(reopened.published(created.id, 1).name).toBe(draft.name);
    expect(reopened.published(created.id).name).toBe("Updated registration");
    expect(reopened.published("request", 1).validationProfile).toBe(
      "request-v1",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("stores backend identities, preserves them across saves and rejects duplicate temporary references", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "field-identity-"));
  try {
    const store = createFormStore(dir, process.cwd());
    const draft = {
      revision: 0,
      name: "Identity test",
      description: "",
      template: "blank",
      fields: [
        {
          key: "tmp_source",
          label: "Source",
          input: "text",
          dataType: "string",
          required: false,
        },
        {
          key: "tmp_target",
          label: "Target",
          input: "text",
          dataType: "string",
          required: false,
          visibility: {
            op: "eq",
            scope: "row",
            key: "tmp_source",
            value: "yes",
          },
        },
      ],
    };
    expect(() =>
      store.create(
        { ...draft, fields: [draft.fields[0], draft.fields[0]] },
        "admin",
      ),
    ).toThrow("Invalid form draft");
    const created = store.create(draft, "admin");
    const fields = created.draft.fields!;
    expect(fields.every((field) => /^f_[a-f0-9]{32}$/.test(field.key))).toBe(
      true,
    );
    expect(fields[1].visibility).toMatchObject({ key: fields[0].key });
    const saved = store.save(
      created.id,
      {
        ...created.draft,
        fields: fields
          .map((field) => ({ ...field, label: `Renamed ${field.label}` }))
          .reverse(),
      },
      "admin",
    );
    expect(saved.draft.fields!.map((field) => field.key)).toEqual(
      fields.map((field) => field.key).reverse(),
    );
    store.publish(created.id, { revision: saved.draft.revision }, "admin");
    expect(
      createFormStore(dir, process.cwd()).published(created.id).fields,
    ).toEqual(saved.draft.fields);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
