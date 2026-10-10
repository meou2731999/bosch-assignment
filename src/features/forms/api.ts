import type {
  FormDraft,
  FormPermissions,
  FormRecord,
  FormSummary,
} from "../../../shared/forms";
import type { AccountUser } from "../../../shared/model";
import { call } from "../../lib/http";
export const formsApi = {
  catalog: () => call<FormSummary[]>(null, "/forms"),
  all: () => call<FormRecord[]>(null, "/admin/forms"),
  create: (draft: FormDraft) =>
    call<FormRecord>(null, "/admin/forms", {
      method: "POST",
      body: JSON.stringify(draft),
    }),
  save: (id: string, draft: FormDraft) =>
    call<FormRecord>(null, `/admin/forms/${encodeURIComponent(id)}/draft`, {
      method: "PUT",
      body: JSON.stringify(draft),
    }),
  publish: (id: string, revision: number) =>
    call<FormRecord>(null, `/admin/forms/${encodeURIComponent(id)}/publish`, {
      method: "POST",
      body: JSON.stringify({ revision }),
    }),
  permissions: (
    id: string,
    revision: number,
    formPermissions: FormPermissions,
  ) =>
    call<AccountUser>(
      null,
      `/admin/users/${encodeURIComponent(id)}/form-permissions`,
      { method: "PUT", body: JSON.stringify({ revision, formPermissions }) },
    ),
};
