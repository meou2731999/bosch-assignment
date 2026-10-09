import type { RequestRecord, SaveInput, User } from "../../../shared/model";
import type { FormType } from "@formio/react";
import { call } from "../../lib/http";
export { HttpError } from "../../lib/http";
export interface Definition {
  version: 1 | 2;
  definition: FormType;
}
export const api = {
  list: (user: User) => call<RequestRecord[]>(user, "/requests"),
  get: (user: User, id: string) =>
    call<RequestRecord>(user, `/requests/${encodeURIComponent(id)}`),
  form: (user: User, version?: number) =>
    call<Definition>(
      user,
      `/forms/request${version ? `/versions/${version}` : ""}`,
    ),
  save: (user: User, id: string, input: SaveInput, fail: boolean) =>
    call<RequestRecord>(user, `/requests/${id}`, {
      method: "PUT",
      headers: fail ? { "x-demo-failure": "true" } : {},
      body: JSON.stringify(input),
    }),
};
