import { saveRequest as persistRequest } from "../../server/requests/service";
import { USERS, type SaveInput } from "../../shared/model";
export const saveRequest = (
  ...args: Parameters<typeof persistRequest> extends [...infer First, unknown]
    ? First
    : never
) => {
  const input = args[2] as SaveInput;
  return persistRequest(...args, {
    formId: input.formId,
    version: input.formVersion,
    validationProfile: input.formVersion === 1 ? "request-v1" : "request-v2",
  });
};
export const [alex, sam, reviewer] = USERS;
export const now = "2026-10-09T09:00:00.000Z";
export function input(patch: Partial<SaveInput> = {}): SaveInput {
  return {
    revision: 0,
    formId: "request",
    formVersion: 1,
    action: "submit",
    attachments: [],
    data: {
      requestTitle: "Monitor for reporting",
      requestType: "equipment",
      equipment: "monitor",
      quantity: 1,
      reason: "A second screen helps with monthly reporting.",
    },
    ...patch,
  };
}
