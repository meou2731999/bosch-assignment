import type { RequestRecord } from "../../shared/model";
import type { RequestSnapshot } from "../../shared/draft-history";
export interface StoredRequest extends RequestRecord {
  snapshots?: RequestSnapshot[];
}
export function publicRecord(record: StoredRequest): RequestRecord {
  const result = structuredClone(record);
  delete result.snapshots;
  return result;
}
function capture(record: RequestRecord): RequestSnapshot {
  return {
    revision: record.revision,
    formVersion: record.formVersion,
    data: structuredClone(record.data),
    attachments: structuredClone(record.attachments),
    at: record.updatedAt,
    actorId: record.audit.at(-1)?.actorId ?? record.ownerId,
  };
}
export function withSnapshots(
  record: RequestRecord,
  previous?: StoredRequest,
): StoredRequest {
  const snapshots = structuredClone(previous?.snapshots ?? []);
  if (
    previous?.status === "draft" &&
    !snapshots.some((item) => item.revision === previous.revision)
  )
    snapshots.push(capture(previous));
  if (record.status === "draft") snapshots.push(capture(record));
  return { ...structuredClone(record), snapshots };
}
