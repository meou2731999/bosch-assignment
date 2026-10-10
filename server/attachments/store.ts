import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Attachment, RequestRecord, User } from "../../shared/model";
import { MAX_FILE_BYTES } from "../../shared/attachments";
import { ApiError } from "../http/errors";

interface StoredFile extends Attachment {
  id: string;
  ownerId: string;
  requestId: string;
  formId: string;
}
function detectType(name: string, bytes: Buffer): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".pdf" && bytes.subarray(0, 5).toString() === "%PDF-")
    return "application/pdf";
  if (
    ext === ".png" &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    [".jpg", ".jpeg"].includes(ext) &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255
  )
    return "image/jpeg";
  if (ext === ".txt" && !bytes.includes(0)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return "text/plain";
    } catch {
      /* Reject invalid UTF-8. */
    }
  }
  throw new ApiError(
    422,
    "FILE_TYPE",
    "File contents must match a PDF, PNG, JPG or UTF-8 TXT file.",
  );
}
export function createAttachmentStore(dataDir: string) {
  const directory = path.join(dataDir, "uploads");
  mkdirSync(directory, { recursive: true });
  function get(id: string): StoredFile {
    if (!/^[a-f0-9-]{36}$/.test(id))
      throw new ApiError(404, "NOT_FOUND", "File not found.");
    try {
      const file: StoredFile = JSON.parse(
        readFileSync(path.join(directory, `${id}.json`), "utf8"),
      );
      return { ...file, formId: file.formId ?? "request" };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT")
        throw new ApiError(404, "NOT_FOUND", "File not found.");
      throw e;
    }
  }
  function publicFile(file: StoredFile): Attachment {
    return { id: file.id, name: file.name, size: file.size, type: file.type };
  }
  return {
    get,
    create(
      user: User,
      requestId: string,
      name: string,
      bytes: Buffer,
      formId: string,
    ): Attachment {
      // Control characters and path separators are deliberately rejected in filenames.
      // eslint-disable-next-line no-control-regex
      if (!name.trim() || name.length > 120 || /[\x00-\x1f\x7f/\\]/.test(name))
        throw new ApiError(422, "FILE_NAME", "Invalid file name.");
      if (
        !Buffer.isBuffer(bytes) ||
        !bytes.length ||
        bytes.length > MAX_FILE_BYTES
      )
        throw new ApiError(
          422,
          "FILE_SIZE",
          "Choose a non-empty file up to 5 MB.",
        );
      const file: StoredFile = {
        id: randomUUID(),
        requestId,
        formId,
        ownerId: user.id,
        name,
        size: bytes.length,
        type: detectType(name, bytes),
      };
      const contentPath = path.join(directory, `${file.id}.bin`);
      try {
        writeFileSync(contentPath, bytes, { flag: "wx" });
        writeFileSync(
          path.join(directory, `${file.id}.json`),
          JSON.stringify(file),
          { flag: "wx" },
        );
      } catch (error) {
        rmSync(contentPath, { force: true });
        throw error;
      }
      return publicFile(file);
    },
    read(file: StoredFile): Buffer {
      try {
        return readFileSync(path.join(directory, `${file.id}.bin`));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT")
          throw new ApiError(404, "NOT_FOUND", "File content is unavailable.");
        throw e;
      }
    },
    resolve(
      user: User,
      requestId: string,
      attachments: Attachment[],
      formId: string,
      previous?: RequestRecord,
    ): Attachment[] {
      const seen = new Set<string>();
      return attachments.map((attachment) => {
        // Earlier metadata-only records remain readable; their missing bytes cannot be recovered.
        if (!attachment.id) {
          const legacy = previous?.attachments.find(
            (old) =>
              !old.id &&
              old.name === attachment.name &&
              old.size === attachment.size &&
              old.type === attachment.type,
          );
          if (!legacy)
            throw new ApiError(
              422,
              "FILE_MISSING",
              "Upload the file before attaching it.",
            );
          return legacy;
        }
        const file = get(attachment.id);
        if (
          file.ownerId !== user.id ||
          file.requestId !== requestId ||
          file.formId !== formId
        )
          throw new ApiError(
            403,
            "FORBIDDEN",
            "This file belongs to a different request.",
          );
        if (seen.has(file.id))
          throw new ApiError(
            422,
            "FILE_DUPLICATE",
            "The same upload cannot be attached twice.",
          );
        seen.add(file.id);
        return publicFile(file); // Never trust client-supplied name, size or MIME metadata.
      });
    },
  };
}
export type AttachmentStore = ReturnType<typeof createAttachmentStore>;
