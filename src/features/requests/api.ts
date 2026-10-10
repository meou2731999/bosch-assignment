import type { BasicField } from "../../../shared/fields";
import type {
  RequestRecord,
  ReviewInput,
  SaveInput,
  User,
} from "../../../shared/model";
import type { FormType } from "@formio/react";
import { call } from "../../lib/http";
export { HttpError } from "../../lib/http";
export interface Definition {
  formId: string;
  name: string;
  version: number;
  definition: FormType;
  fields?: BasicField[];
}
export const api = {
  review: (user: User, id: string, input: ReviewInput) =>
    call<RequestRecord>(user, `/requests/${encodeURIComponent(id)}/review`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  list: (user: User) => call<RequestRecord[]>(user, "/requests"),
  get: (user: User, id: string) =>
    call<RequestRecord>(user, `/requests/${encodeURIComponent(id)}`),
  form: (user: User, formId: string, version?: number) => {
    const suffix = version ? `/versions/${version}` : "";
    return call<Definition>(
      user,
      `/forms/${encodeURIComponent(formId)}${suffix}`,
    );
  },
  save: (user: User, id: string, input: SaveInput, fail: boolean) =>
    call<RequestRecord>(user, `/requests/${id}`, {
      method: "PUT",
      headers: fail ? { "x-demo-failure": "true" } : {},
      body: JSON.stringify(input),
    }),
};
