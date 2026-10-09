import { describe, expect, it } from "vitest";
import { ApiError, canRead, saveRequest } from "../server/requests/service";
import { USERS, type SaveInput } from "../shared/model";
import { seedRequests } from "../server/seed";
const [alex, sam, reviewer] = USERS;
const now = "2026-10-09T09:00:00.000Z";
function input(patch: Partial<SaveInput> = {}): SaveInput {
  return {
    revision: 0,
    formVersion: 1,
    action: "submit",
    attachments: [],
    data: {
      requestTitle: "Monitor for reporting",
      requestType: "equipment",
      equipment: "monitor",
      quantity: 1,
      reason: "A second screen helps with monthly reporting.",
    },
    ...patch,
  };
}
function failure(fn: () => unknown, status: number, code: string) {
  try {
    fn();
    throw new Error("Expected API rejection");
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status, code });
  }
}
describe("request access and lifecycle", () => {
  it("allows incomplete drafts, but rejects incomplete final submissions", () => {
    expect(
      saveRequest(
        alex,
        undefined,
        input({ action: "draft", data: {} }),
        "one",
        now,
      ).status,
    ).toBe("draft");
    failure(
      () => saveRequest(alex, undefined, input({ data: {} }), "one", now),
      422,
      "INVALID",
    );
  });
  it("requires fields for each active conditional section", () => {
    failure(
      () =>
        saveRequest(
          alex,
          undefined,
          input({
            data: {
              requestTitle: "Application access",
              reason: "Needed for reporting",
              requestType: "software",
            },
          }),
          "one",
          now,
        ),
      422,
      "INVALID",
    );
    failure(
      () =>
        saveRequest(
          alex,
          undefined,
          input({
            data: {
              requestTitle: "New equipment",
              reason: "Needed for reporting",
              requestType: "equipment",
            },
          }),
          "one",
          now,
        ),
      422,
      "INVALID",
    );
  });
  it("removes stale hidden data before validating and saving", () => {
    const result = saveRequest(
      alex,
      undefined,
      input({
        data: { ...input().data, application: "analytics", accessDays: -99 },
      }),
      "one",
      now,
    );
    expect(result.data).not.toHaveProperty("application");
    expect(result.data).not.toHaveProperty("accessDays");
    expect(result.data.quantity).toBe(1);
  });
  it("rejects invalid bounds even on draft save", () => {
    failure(
      () =>
        saveRequest(
          alex,
          undefined,
          input({ action: "draft", data: { ...input().data, quantity: 26 } }),
          "one",
          now,
        ),
      422,
      "INVALID",
    );
  });
  it("checks ownership and requester role on the server", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    failure(
      () => saveRequest(sam, draft, input({ revision: 1 }), "one", now),
      403,
      "FORBIDDEN",
    );
    failure(
      () => saveRequest(reviewer, undefined, input(), "two", now),
      403,
      "FORBIDDEN",
    );
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
    failure(
      () => saveRequest(alex, draft, input(), "one", now),
      409,
      "CONFLICT",
    );
    const submitted = saveRequest(
      alex,
      draft,
      input({ revision: 1 }),
      "one",
      now,
    );
    failure(
      () => saveRequest(alex, submitted, input({ revision: 2 }), "one", now),
      409,
      "LOCKED",
    );
  });
  it("pins existing drafts to their original form version", () => {
    const draft = saveRequest(
      alex,
      undefined,
      input({ action: "draft" }),
      "one",
      now,
    );
    failure(
      () =>
        saveRequest(
          alex,
          draft,
          input({ revision: 1, formVersion: 2 }),
          "one",
          now,
        ),
      409,
      "VERSION",
    );
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
      failure(
        () =>
          saveRequest(
            alex,
            undefined,
            input({ attachments: [attachment] }),
            "one",
            now,
          ),
        422,
        "INVALID",
      );
    }
  });
  it("shows seeded approval status without granting write access", () => {
    const record = seedRequests()[0];
    expect(record.status).toBe("in_review");
    expect(canRead(reviewer, record)).toBe(true);
    failure(
      () =>
        saveRequest(
          alex,
          record,
          input({ revision: record.revision }),
          record.id,
          now,
        ),
      409,
      "LOCKED",
    );
  });
});
