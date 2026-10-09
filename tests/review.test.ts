import { describe, expect, it } from "vitest";
import { reviewRequest } from "../server/requests/review";
import { seedRequests } from "../server/seed";
import { USERS, type Status } from "../shared/model";
const now = "2026-10-09T10:00:00Z";
const record = seedRequests()[0];
const review = {
  revision: record.revision,
  decision: "approve",
  comment: "Approved for quarterly planning.",
};
describe("review decisions", () => {
  it("approves with a server-owned actor and comment without changing request data", () => {
    const next = reviewRequest(
      USERS[2],
      record,
      { ...review, ownerId: "morgan", actorId: "sam" },
      now,
    );
    expect(next.status).toBe("approved");
    expect(next.revision).toBe(record.revision + 1);
    expect(next.ownerId).toBe(record.ownerId);
    expect(next.data).toEqual(record.data);
    expect(next.audit.at(-1)).toEqual({
      at: now,
      actorId: "morgan",
      action: "approved",
      comment: review.comment,
    });
  });
  it("requires a nonblank rejection reason", () => {
    expect(() =>
      reviewRequest(
        USERS[2],
        record,
        { ...review, decision: "reject", comment: "  " },
        now,
      ),
    ).toThrow("reason is required");
    expect(
      reviewRequest(
        USERS[2],
        record,
        {
          ...review,
          decision: "reject",
          comment: "  Missing justification.  ",
        },
        now,
      ).audit.at(-1)?.comment,
    ).toBe("Missing justification.");
  });
  it("allows approval without an optional comment", () => {
    expect(
      reviewRequest(USERS[2], record, { ...review, comment: "" }, now).audit.at(
        -1,
      ),
    ).not.toHaveProperty("comment");
  });
  it("blocks requesters even when they own the record", () => {
    expect(() => reviewRequest(USERS[0], record, review, now)).toThrow(
      "Only reviewers",
    );
  });
  it.each(["draft", "approved", "rejected"] as Status[])(
    "blocks reviewing a %s record",
    (status) => {
      expect(() =>
        reviewRequest(USERS[2], { ...record, status }, review, now),
      ).toThrow("Only submitted");
    },
  );
  it("rejects stale decisions and overlong comments", () => {
    expect(() =>
      reviewRequest(
        USERS[2],
        record,
        { ...review, revision: record.revision + 1 },
        now,
      ),
    ).toThrow("newer revision");
    expect(() =>
      reviewRequest(
        USERS[2],
        record,
        { ...review, comment: "x".repeat(2001) },
        now,
      ),
    ).toThrow("2,000");
  });
});
