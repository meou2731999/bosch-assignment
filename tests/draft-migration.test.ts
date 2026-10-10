import { describe, expect, it } from "vitest";
import type { PublishedForm } from "../shared/forms";
import { fieldDefinition } from "../shared/field-definition";
import { validateFields } from "../shared/field-validation";
import { migrationCandidate } from "../server/requests/migrate-data";
import { schemaDiff } from "../server/requests/schema-diff";
import { draftPreview, applyPreview } from "../server/requests/draft-preview";
import { advancedFields, advancedData } from "./fixtures/advanced-fields";
import {
  oldFields,
  newFields,
  draftData,
  validData,
} from "./fixtures/draft-upgrades";
import { saveRequest, alex, input, now } from "./helpers/request-service";
function form(fields = oldFields, version = 1): PublishedForm {
  return {
    formId: "request",
    version,
    fields,
    name: "Migration",
    description: "",
    validationProfile: "request-v2",
    definition: fieldDefinition("Migration", fields),
    publishedAt: now,
    publishedBy: "admin",
  };
}
describe("strict migration candidates and explicit preview fingerprints", () => {
  it("keeps invalid supplied values for correction, reports removed fields and required additions without mutating input", () => {
    const raw = structuredClone(draftData),
      result = migrationCandidate(form(newFields, 2), raw);
    expect(result.data).toEqual({ requestTitle: raw.requestTitle, amount: 5 });
    expect(result.dataChanges.map((item) => item.path)).toEqual(["obsolete"]);
    expect(result.submissionErrors).toEqual({
      amount: "Maximum: 2.",
      contact: "This field is required.",
    });
    expect(raw).toEqual(draftData);
  });
  it("preserves invalid options, oversized rows and incompatible child values instead of silently repairing them", () => {
    const fields = structuredClone(advancedFields);
    fields[1].options = [{ label: "Normal", value: "normal" }];
    fields[3].maxLength = 1;
    fields[3].fields![0].max = 1;
    const raw = advancedData();
    raw.tags = ["urgent", "normal"];
    raw.items.push({ quantity: 1 });
    const result = migrationCandidate(form(fields, 2), raw);
    expect(result.data.tags).toEqual(raw.tags);
    expect(result.data.items).toEqual(raw.items);
    expect(result.submissionErrors).toHaveProperty("tags");
    expect(result.submissionErrors).toHaveProperty("items");
    expect(result.submissionErrors).toHaveProperty("items.0.quantity");
  });
  it("blocks empty collections, invalid types and required additions until the candidate is fully valid", () => {
    const fields = structuredClone(advancedFields);
    fields[3].minLength = 2;
    const result = migrationCandidate(form(fields), advancedData());
    expect(result.data.items).toEqual([{ quantity: 2 }]);
    expect(result.submissionErrors).toHaveProperty("items");
    const valid = migrationCandidate(form(newFields), validData);
    expect(valid.submissionErrors).toEqual({});
    expect(validateFields(newFields, valid.data, true).errors).toEqual({});
  });
  it("diffs nested types, validators, visibility, additions/removals and order", () => {
    const fields = structuredClone(advancedFields);
    fields[2].fields![1].fields![2].visibility = {
      op: "eq",
      scope: "parent",
      key: "enabled",
      value: false,
    };
    expect(schemaDiff(form(advancedFields), form(fields, 2))).toEqual([
      expect.objectContaining({
        path: "details.people[].note",
        kind: "changed",
      }),
    ]);
    expect(
      schemaDiff(form(oldFields), form(newFields, 2)).map((item) => [
        item.path,
        item.kind,
      ]),
    ).toEqual([
      ["amount", "changed"],
      ["obsolete", "removed"],
      ["contact", "added"],
    ]);
    expect(
      schemaDiff(form(oldFields), form([...oldFields].reverse(), 2)),
    ).toHaveLength(2);
  });
  it("blocks a confirmed invalid candidate and applies only a valid unchanged fingerprint", () => {
    const record = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "preview",
      now,
    );
    const before = form(oldFields),
      target = form(newFields, 2);
    const invalid = draftPreview(
      { ...record, data: draftData },
      before,
      target,
    );
    expect(() =>
      applyPreview(record, invalid, alex.id, invalid.token, now),
    ).toThrow("Correct all values");
    const preview = draftPreview(record, before, target, undefined, validData);
    expect(() =>
      applyPreview(record, preview, alex.id, "bad-token", now),
    ).toThrow("preview has changed");
    const next = applyPreview(record, preview, alex.id, preview.token, now);
    expect(record.formVersion).toBe(1);
    expect(next.formVersion).toBe(2);
    expect(next.revision).toBe(2);
    expect(next.data).toEqual(validData);
    expect(next.audit.at(-1)).toMatchObject({
      action: "draft_upgraded",
      actorId: alex.id,
      fromVersion: 1,
      toVersion: 2,
    });
  });
});
