import type { PublishedForm } from "./forms";
import type { Attachment, RequestData } from "./model";
export interface RequestSnapshot {
  revision: number;
  formVersion: number;
  data: RequestData;
  attachments: Attachment[];
  at: string;
  actorId: string;
}
export type SnapshotSummary = Omit<RequestSnapshot, "data" | "attachments">;
export interface SchemaChange {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
export interface DataChange {
  path: string;
  before: unknown;
  after?: unknown;
  kind: "added" | "removed" | "changed";
}
export interface DraftPreview {
  requestId: string;
  revision: number;
  fromVersion: number;
  toVersion: number;
  operation: "upgrade" | "restore";
  snapshotRevision?: number;
  token: string;
  target: PublishedForm;
  schemaChanges: SchemaChange[];
  dataChanges: DataChange[];
  data: RequestData;
  attachments: Attachment[];
  submissionErrors: Record<string, string>;
}
