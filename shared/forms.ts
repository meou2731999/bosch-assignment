import type { BasicField } from "./fields";
import type { User } from "./model";
export type FormPermission = "create" | "view" | "review";
export type FormPermissions = Record<string, FormPermission[]>;
export type FormTemplate = "request-v1" | "request-v2" | "blank";
export interface FormDefinition {
  display: "form";
  type: "form";
  title: string;
  components: Record<string, unknown>[];
}
export interface PublishedForm {
  formId: string;
  version: number;
  name: string;
  description: string;
  definition: FormDefinition;
  validationProfile: FormTemplate;
  fields?: BasicField[];
  publishedAt: string;
  publishedBy: string;
}
export interface FormDraft {
  revision: number;
  name: string;
  description: string;
  template: FormTemplate;
  fields?: BasicField[];
}
export interface FormRecord {
  id: string;
  activeVersion: number | null;
  draft: FormDraft;
  versions: PublishedForm[];
  audit: {
    action: "created" | "draft_saved" | "published";
    actorId: string;
    at: string;
    version?: number;
  }[];
}
export interface FormSummary {
  id: string;
  name: string;
  description: string;
  activeVersion: number;
  permissions: FormPermission[];
}
export function hasFormPermission(
  user: User,
  formId: string,
  permission: FormPermission,
) {
  const grants = Object.hasOwn(user.formPermissions, formId)
    ? user.formPermissions[formId]
    : [];
  return (
    grants.includes(permission) ||
    (permission === "view" && grants.includes("review"))
  );
}
export function canAccessForm(user: User, formId: string) {
  return (
    Boolean(user.isAdmin) ||
    hasFormPermission(user, formId, "create") ||
    hasFormPermission(user, formId, "view")
  );
}
