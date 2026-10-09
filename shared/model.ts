export type Role = "requester" | "reviewer";
export type Status =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected";
export type Locale = "en" | "vi";
export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
}
export const USERS: User[] = [
  {
    id: "alex",
    name: "Alex Nguyen",
    role: "requester",
    department: "Operations",
  },
  { id: "sam", name: "Sam Patel", role: "requester", department: "Sales" },
  {
    id: "morgan",
    name: "Morgan Lee",
    role: "reviewer",
    department: "IT Services",
  },
];
export interface RequestData {
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
  name: string;
  size: number;
  type: string;
}
export interface AuditEvent {
  at: string;
  actorId: string;
  comment?: string;
  action:
    | "created"
    | "draft_saved"
    | "submitted"
    | "in_review"
    | "approved"
    | "rejected";
}
export interface RequestRecord {
  id: string;
  ownerId: string;
  formVersion: 1 | 2;
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
  formVersion: 1 | 2;
  action: "draft" | "submit";
  data: RequestData;
  attachments: Attachment[];
}

export interface ReviewInput {
  revision: number;
  decision: "approve" | "reject";
  comment: string;
}
