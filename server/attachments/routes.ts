import { hasFormPermission } from "../../shared/forms";
import type { FormStore } from "../forms/store";
import express, { type Express } from "express";
import { MAX_FILE_BYTES } from "../../shared/attachments";
import { ApiError } from "../http/errors";
import { canRead } from "../requests/service";
import type { RequestStore } from "../storage/requests";
import type { AttachmentStore } from "./store";

export function registerAttachmentRoutes(
  app: Express,
  requests: RequestStore,
  files: AttachmentStore,
  forms: FormStore,
) {
  app.post(
    "/api/requests/:id/attachments",
    (req, res, next) => {
      const user = res.locals.user;
      const record = requests.get(req.params.id);
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(req.params.id))
        return next(new ApiError(400, "INVALID", "Invalid request ID."));
      const formId = record?.formId ?? req.header("x-form-id");
      if (
        !formId ||
        !hasFormPermission(user, formId, "create") ||
        (record && record.ownerId !== user.id)
      )
        return next(
          new ApiError(
            403,
            "FORBIDDEN",
            "You cannot attach files to this request.",
          ),
        );
      if (
        record &&
        req.header("x-form-id") &&
        req.header("x-form-id") !== record.formId
      )
        return next(
          new ApiError(
            409,
            "VERSION",
            "A request must keep its original form type.",
          ),
        );
      try {
        forms.published(formId, record?.formVersion);
      } catch (error) {
        return next(error);
      }
      res.locals.formId = formId;
      if (record && record.status !== "draft")
        return next(
          new ApiError(
            409,
            "LOCKED",
            "This request has already been submitted.",
          ),
        );
      if (!req.is("application/octet-stream"))
        return next(
          new ApiError(415, "FILE_TYPE", "Upload the file as binary content."),
        );
      next();
    },
    express.raw({ type: "application/octet-stream", limit: MAX_FILE_BYTES }),
    (req, res, next) => {
      try {
        let name: string;
        try {
          name = decodeURIComponent(req.header("x-file-name") ?? "");
        } catch {
          throw new ApiError(422, "FILE_NAME", "Invalid file name.");
        }
        res
          .status(201)
          .json(
            files.create(
              res.locals.user,
              req.params.id,
              name,
              req.body,
              res.locals.formId,
            ),
          );
      } catch (error) {
        next(error);
      }
    },
  );
  app.get("/api/attachments/:id", (req, res, next) => {
    try {
      const file = files.get(req.params.id);
      const record = requests.get(file.requestId);
      const linked =
        record?.formId === file.formId &&
        record.attachments.some((attachment) => attachment.id === file.id);
      const pendingOwner =
        file.ownerId === res.locals.user.id &&
        hasFormPermission(res.locals.user, file.formId, "create") &&
        (!record || record.formId === file.formId) &&
        (!record || record.status === "draft");
      if (
        !(record && linked && canRead(res.locals.user, record)) &&
        !pendingOwner
      )
        throw new ApiError(404, "NOT_FOUND", "File not found.");
      res.set({
        "Content-Type": file.type,
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      });
      res.send(files.read(file));
    } catch (error) {
      next(error);
    }
  });
}
