import type { FormStore } from "../forms/store";
import { hasFormPermission } from "../../shared/forms";
import type { AttachmentStore } from "../attachments/store";
import { reviewRequest } from "./review";
import type { Express } from "express";
import { ApiError, canRead, saveRequest } from "./service";
import type { RequestStore } from "../storage/requests";
export function registerRequestRoutes(
  app: Express,
  store: RequestStore,
  files: AttachmentStore,
  forms: FormStore,
) {
  app.post("/api/requests/:id/review", (req, res, next) => {
    try {
      const previous = store.get(req.params.id);
      if (!previous) throw new ApiError(404, "NOT_FOUND", "Request not found.");
      const record = reviewRequest(
        res.locals.user,
        previous,
        req.body,
        new Date().toISOString(),
      );
      store.put(record);
      res.json(record);
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/requests", (_req, res) => {
    res.json(
      store
        .all()
        .filter((r) => canRead(res.locals.user, r))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  });
  app.get("/api/requests/:id", (req, res, next) => {
    const record = store.get(req.params.id);
    if (!record || !canRead(res.locals.user, record))
      return next(new ApiError(404, "NOT_FOUND", "Request not found."));
    res.json(record);
  });
  app.put("/api/requests/:id", (req, res, next) => {
    try {
      if (!/^[a-zA-Z0-9-]{1,80}$/.test(req.params.id))
        throw new ApiError(400, "INVALID", "Invalid request ID.");
      if (req.header("x-demo-failure") === "true")
        throw new ApiError(
          503,
          "UNAVAILABLE",
          "The demo API is temporarily unavailable. Your form has not been saved.",
        );
      const previous = store.get(req.params.id);
      const formId = req.body?.formId;
      if (
        typeof formId !== "string" ||
        !hasFormPermission(res.locals.user, formId, "create")
      )
        throw new ApiError(
          403,
          "FORBIDDEN",
          "You cannot create requests for this form.",
        );
      if (previous && previous.formId !== formId)
        throw new ApiError(
          409,
          "VERSION",
          "A request must keep its original form type.",
        );
      const form = forms.published(formId, previous?.formVersion);
      const record = saveRequest(
        res.locals.user,
        previous,
        req.body,
        req.params.id,
        new Date().toISOString(),
        form,
      );
      record.attachments = files.resolve(
        res.locals.user,
        record.id,
        record.attachments,
        record.formId,
        previous,
      );
      store.put(record);
      res.status(previous ? 200 : 201).json(record);
    } catch (error) {
      next(error);
    }
  });
}
