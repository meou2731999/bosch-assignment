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
  version: 1 | 2;
  definition: FormType;
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
  form: (user: User, version?: number) => {
    const suffix = version ? `/versions/${version}` : "";
    return call<Definition>(user, `/forms/request${suffix}`);
  },
  save: (user: User, id: string, input: SaveInput, fail: boolean) =>
    call<RequestRecord>(user, `/requests/${id}`, {
      method: "PUT",
      headers: fail ? { "x-demo-failure": "true" } : {},
      body: JSON.stringify(input),
    }),
};
