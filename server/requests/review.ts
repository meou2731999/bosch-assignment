import { z } from "zod";
import type { RequestRecord, User } from "../../shared/model";
import { ApiError } from "../http/errors";

const reviewSchema = z.object({
  revision: z.number().int().min(1),
  decision: z.enum(["approve", "reject"]),
  comment: z.string().trim().max(2000),
});

export function reviewRequest(
  user: User,
  record: RequestRecord,
  raw: unknown,
  now: string,
): RequestRecord {
  if (user.role !== "reviewer")
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only reviewers may make a review decision.",
    );
  const result = reviewSchema.safeParse(raw);
  if (!result.success)
    throw new ApiError(
      422,
      "INVALID",
      "Check the decision and comment (maximum 2,000 characters).",
    );
  const input = result.data;
  if (record.revision !== input.revision)
    throw new ApiError(
      409,
      "CONFLICT",
      "A newer revision exists. Reload the request before reviewing.",
    );
  if (!["submitted", "in_review"].includes(record.status))
    throw new ApiError(
      409,
      "LOCKED",
      "Only submitted or in-review requests can be approved or rejected.",
    );
  if (input.decision === "reject" && !input.comment)
    throw new ApiError(
      422,
      "COMMENT_REQUIRED",
      "A rejection reason is required.",
    );
  const status = input.decision === "approve" ? "approved" : "rejected";
  return {
    ...record,
    status,
    revision: record.revision + 1,
    updatedAt: now,
    audit: [
      ...record.audit,
      {
        at: now,
        actorId: user.id,
        action: status,
        ...(input.comment ? { comment: input.comment } : {}),
      },
    ],
  };
}
