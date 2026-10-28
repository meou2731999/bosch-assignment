import { apiMessages } from "../../shared/i18n/api-en";
import { hasFormPermission } from "../../shared/forms";
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
  if (
    !hasFormPermission(user, record.formId, "review") ||
    user.id === record.ownerId
  )
    throw new ApiError(
      403,
      "FORBIDDEN",
      apiMessages.onlyReviewersWithFormPermissionMayReviewAnotherUser,
    );
  const result = reviewSchema.safeParse(raw);
  if (!result.success)
    throw new ApiError(
      422,
      "INVALID",
      apiMessages.checkTheDecisionAndCommentMaximum2000Characters,
    );
  const input = result.data;
  if (record.revision !== input.revision)
    throw new ApiError(
      409,
      "CONFLICT",
      apiMessages.aNewerRevisionExistsReloadTheRequestBeforeReviewing,
    );
  if (!["submitted", "in_review"].includes(record.status))
    throw new ApiError(
      409,
      "LOCKED",
      apiMessages.onlySubmittedOrInReviewRequestsCanBeApproved,
    );
  if (input.decision === "reject" && !input.comment)
    throw new ApiError(
      422,
      "COMMENT_REQUIRED",
      apiMessages.aRejectionReasonIsRequired,
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
