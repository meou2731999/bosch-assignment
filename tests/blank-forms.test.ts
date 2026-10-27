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
