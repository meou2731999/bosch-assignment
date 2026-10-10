import { describe, expect, it } from "vitest";
import { canRead } from "../server/requests/service";
import { seedRequests } from "../server/seed";
import {
  saveRequest,
  alex,
  sam,
  reviewer,
  now,
  input,
} from "./helpers/request-service";
describe("request lifecycle", () => {
  it("checks ownership and requester role on the server", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    expect(() =>
      saveRequest(sam, draft, input({ revision: 1 }), "one", now),
    ).toThrowError(expect.objectContaining({ status: 403, code: "FORBIDDEN" }));
    expect(() =>
      saveRequest(reviewer, undefined, input(), "two", now),
    ).toThrowError(expect.objectContaining({ status: 403, code: "FORBIDDEN" }));
    expect(canRead(alex, draft)).toBe(true);
    expect(canRead(sam, draft)).toBe(false);
    expect(canRead(reviewer, draft)).toBe(true);
  });
  it("saves a draft then submits the same record with server-owned identity and audit", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    const submitted = saveRequest(
      alex,
      draft,
      {
        ...input({ revision: 1 }),
        ownerId: sam.id,
        status: "approved",
        audit: [],
      },
      "one",
      now,
    );
    expect(submitted).toMatchObject({
      id: "one",
      ownerId: alex.id,
      revision: 2,
      status: "submitted",
    });
    expect(submitted.audit.map((e) => e.action)).toEqual([
      "created",
      "submitted",
    ]);
    expect(submitted.audit.every((e) => e.actorId === alex.id)).toBe(true);
  });
  it("rejects stale revisions and changes after final submission", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    expect(() => saveRequest(alex, draft, input(), "one", now)).toThrowError(
      expect.objectContaining({ status: 409, code: "CONFLICT" }),
    );
    const submitted = saveRequest(
      alex,
      draft,
      input({ revision: 1 }),
      "one",
      now,
    );
    expect(() =>
      saveRequest(alex, submitted, input({ revision: 2 }), "one", now),
    ).toThrowError(expect.objectContaining({ status: 409, code: "LOCKED" }));
  });
  it("pins existing drafts to their original form version", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    expect(() =>
      saveRequest(
        alex,
        draft,
        input({ revision: 1, formVersion: 2 }),
        "one",
        now,
      ),
    ).toThrowError(expect.objectContaining({ status: 409, code: "VERSION" }));
  });
  it("keeps the v2 field only on v2 requests", () => {
    const raw = input({
      data: { ...input().data, additionalNotes: "Useful detail" },
    });
    expect(
      saveRequest(alex, undefined, raw, "one", now).data,
    ).not.toHaveProperty("additionalNotes");
    expect(
      saveRequest(alex, undefined, { ...raw, formVersion: 2 }, "two", now).data
        .additionalNotes,
    ).toBe("Useful detail");
  });
  it("validates attachment metadata and rejects oversized or unsupported files", () => {
    const file = { name: "spec.pdf", size: 200, type: "application/pdf" };
    expect(
      saveRequest(alex, undefined, input({ attachments: [file] }), "one", now)
        .attachments,
    ).toEqual([file]);
    for (const attachment of [
      { ...file, size: 6 * 1024 * 1024 },
      { ...file, type: "application/javascript" },
    ]) {
      expect(() =>
        saveRequest(
          alex,
          undefined,
          input({ attachments: [attachment] }),
          "one",
          now,
        ),
      ).toThrowError(expect.objectContaining({ status: 422, code: "INVALID" }));
    }
  });
  it("shows seeded approval status without granting write access", () => {
    const record = seedRequests()[0];
    expect(record.status).toBe("in_review");
    expect(canRead(reviewer, record)).toBe(true);
    expect(() =>
      saveRequest(
        alex,
        record,
        input({ revision: record.revision }),
        record.id,
        now,
      ),
    ).toThrowError(expect.objectContaining({ status: 409, code: "LOCKED" }));
  });
});
