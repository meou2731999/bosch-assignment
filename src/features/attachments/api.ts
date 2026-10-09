import type { Attachment, User } from "../../../shared/model";
import { call, request } from "../../lib/http";
export const attachmentApi = {
  upload: (user: User, requestId: string, file: File, signal: AbortSignal) =>
    call<Attachment>(
      user,
      `/requests/${encodeURIComponent(requestId)}/attachments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
        signal,
      },
    ),
  content: async (user: User, id: string, signal: AbortSignal) =>
    (
      await request(user, `/attachments/${encodeURIComponent(id)}`, { signal })
    ).blob(),
};
