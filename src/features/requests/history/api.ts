import type {
  DraftPreview,
  SnapshotSummary,
} from "../../../../shared/draft-history";
import type { RequestRecord, User } from "../../../../shared/model";
import { call } from "../../../lib/http";
function input(preview: DraftPreview) {
  const target =
    preview.operation === "upgrade"
      ? { targetVersion: preview.toVersion, data: preview.data }
      : { snapshotRevision: preview.snapshotRevision };
  return {
    revision: preview.revision,
    ...target,
    confirm: true,
    token: preview.token,
  };
}
export const historyApi = {
  list: (user: User, id: string) =>
    call<SnapshotSummary[]>(
      user,
      `/requests/${encodeURIComponent(id)}/snapshots`,
    ),
  preview: (user: User, record: RequestRecord, snapshotRevision?: number) => {
    const operation = snapshotRevision === undefined ? "upgrade" : "restore";
    return async (targetVersion: number, data?: Record<string, unknown>) =>
      call<DraftPreview>(
        user,
        `/requests/${encodeURIComponent(record.id)}/${operation}/preview`,
        {
          method: "POST",
          body: JSON.stringify({
            revision: record.revision,
            ...(snapshotRevision === undefined
              ? { targetVersion, ...(data ? { data } : {}) }
              : { snapshotRevision }),
          }),
        },
      );
  },
  apply: (user: User, preview: DraftPreview) =>
    call<RequestRecord>(
      user,
      `/requests/${encodeURIComponent(preview.requestId)}/${preview.operation}`,
      { method: "POST", body: JSON.stringify(input(preview)) },
    ),
};
