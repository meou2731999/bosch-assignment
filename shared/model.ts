import type { FormPermissions } from "./forms";
export type Role = "requester" | "reviewer";
export type Status =
  "draft" | "submitted" | "in_review" | "approved" | "rejected";
export type Locale = "en" | "vi";
export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
  isAdmin?: boolean;
  formPermissions: FormPermissions;
}
export interface AccountUser extends User {
  email: string;
  isAdmin: boolean;
  active: boolean;
  mustChangePassword: boolean;
  permissionRevision: number;
}
export const USERS: User[] = [
  {
    id: "alex",
    name: "Alex Nguyen",
    role: "requester",
    department: "Operations",
    formPermissions: { request: ["create"] },
  },
  {
    id: "sam",
    name: "Sam Patel",
    role: "requester",
    department: "Sales",
    formPermissions: { request: ["create"] },
  },
  {
    id: "morgan",
    name: "Morgan Lee",
    role: "reviewer",
    department: "IT Services",
    formPermissions: { request: ["view", "review"] },
  },
];
export interface RequestData {
  [key: string]: unknown;
  requestTitle?: string;
  requestType?: "equipment" | "software";
  reason?: string;
  equipment?: "laptop" | "monitor" | "headset";
  quantity?: number;
  application?: "design" | "analytics" | "project";
  accessDays?: number;
  additionalNotes?: string;
}
export interface Attachment {
  id?: string; // Absent only for legacy metadata-only attachments.
  name: string;
  size: number;
  type: string;
}
export interface AuditEvent {
  at: string;
  actorId: string;
  comment?: string;
  fromVersion?: number;
  toVersion?: number;
  snapshotRevision?: number;
  changes?: { path: string; kind: "added" | "removed" | "changed" }[];
  action:
    | "created"
    | "draft_saved"
    | "draft_upgraded"
    | "draft_restored"
    | "submitted"
    | "in_review"
    | "approved"
    | "rejected";
}
export interface RequestRecord {
  id: string;
  ownerId: string;
  formId: string;
  formVersion: number;
  revision: number;
  status: Status;
  data: RequestData;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  audit: AuditEvent[];
}
export interface SaveInput {
  revision: number;
  formId: string;
  formVersion: number;
  action: "draft" | "submit";
  data: RequestData;
  attachments: Attachment[];
}

export interface ReviewInput {
  revision: number;
  decision: "approve" | "reject";
  comment: string;
}
