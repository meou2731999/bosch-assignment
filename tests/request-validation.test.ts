import { describe, expect, it } from "vitest";
import { saveRequest, alex, now, input } from "./helpers/request-service";
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
    expect(() =>
      saveRequest(alex, undefined, input({ data: {} }), "one", now),
    ).toThrowError(expect.objectContaining({ status: 422, code: "INVALID" }));
  });
  it("requires fields for each active conditional section", () => {
    expect(() =>
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
    ).toThrowError(expect.objectContaining({ status: 422, code: "INVALID" }));
    expect(() =>
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
    ).toThrowError(expect.objectContaining({ status: 422, code: "INVALID" }));
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
    expect(() =>
      saveRequest(
        alex,
        undefined,
        input({ action: "draft", data: { ...input().data, quantity: 26 } }),
        "one",
        now,
      ),
    ).toThrowError(expect.objectContaining({ status: 422, code: "INVALID" }));
  });
});
