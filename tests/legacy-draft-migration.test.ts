import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { PublishedForm } from "../shared/forms";
import { migrationCandidate, dataDiff } from "../server/requests/migrate-data";
import { schemaDiff } from "../server/requests/schema-diff";
import { draftPreview } from "../server/requests/draft-preview";
import { saveRequest, alex, input, now } from "./helpers/request-service";
function form(version: 1 | 2): PublishedForm {
  return {
    formId: "request",
    version,
    name: "Legacy",
    description: "",
    validationProfile: version === 1 ? "request-v1" : "request-v2",
    publishedAt: now,
    publishedBy: "migration",
    definition: JSON.parse(
      readFileSync(
        new URL(`../forms/request.v${version}.json`, import.meta.url),
        "utf8",
      ),
    ),
  };
}
describe("legacy migration and historical restore compatibility", () => {
  it("diffs the legacy JSON and retains compatible saved data without replacing the old schema", () => {
    const first = form(1),
      second = form(2);
    expect(schemaDiff(first, second)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "additionalNotes", kind: "added" }),
      ]),
    );
    const result = migrationCandidate(second, input().data);
    expect(result.data).toEqual(input().data);
    expect(result.submissionErrors).toEqual({});
    expect(first.definition).not.toEqual(second.definition);
  });
  it("normalizes inactive sections but retains invalid legacy values for correction", () => {
    const raw = {
      ...input().data,
      quantity: 30,
      additionalNotes: "Only v2",
      application: "analytics",
    };
    const result = migrationCandidate(form(1), raw);
    expect(result.data.quantity).toBe(30);
    expect(result.data).not.toHaveProperty("additionalNotes");
    expect(result.data).not.toHaveProperty("application");
    expect(result.submissionErrors).toHaveProperty("quantity");
    expect(result.dataChanges.map((change) => change.path)).toEqual([
      "additionalNotes",
      "application",
    ]);
  });
  it("shows both restored additions and removals while keeping historical data and attachment metadata exact", () => {
    const initial = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "legacy-restore",
      now,
    );
    const snapshot = {
      revision: 1,
      formVersion: 1,
      data: structuredClone(initial.data),
      attachments: [],
      at: now,
      actorId: alex.id,
    };
    const current = {
      ...initial,
      formVersion: 2,
      revision: 2,
      data: {
        ...initial.data,
        quantity: undefined,
        additionalNotes: "Later note",
      },
    };
    const preview = draftPreview(current, form(2), form(1), snapshot);
    expect(preview.data).toEqual(initial.data);
    expect(preview.dataChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "quantity", kind: "added" }),
        expect.objectContaining({ path: "additionalNotes", kind: "removed" }),
      ]),
    );
    expect(preview.attachments).toEqual(snapshot.attachments);
    expect(dataDiff({ a: 1 }, { b: 2 })).toEqual([
      { path: "a", before: 1, kind: "removed" },
      { path: "b", before: undefined, after: 2, kind: "added" },
    ]);
  });
});
