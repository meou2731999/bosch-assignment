import { createAttachmentStore } from "./attachments/store";
import { registerAttachmentRoutes } from "./attachments/routes";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUserStore } from "./auth/users";
import { registerAuth } from "./auth/routes";
import { ApiError } from "./http/errors";
import { createRequestStore } from "./storage/requests";
import { registerRequestRoutes } from "./requests/routes";
import { createFormStore } from "./forms/store";
import { registerFormRoutes } from "./forms/routes";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export function createApp({
  dataDir = path.join(root, ".data"),
  production = false,
  secureCookies = false,
} = {}) {
  const forms = createFormStore(dataDir, root);
  const users = createUserStore(dataDir);
  const store = createRequestStore(dataDir);
  const files = createAttachmentStore(dataDir);
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.json({ status: "ok", authentication: "session" }),
  );
  registerAuth(app, users, secureCookies);
  registerFormRoutes(app, forms, users);
  registerRequestRoutes(app, store, files, forms);
  registerAttachmentRoutes(app, store, files, forms);
  app.use("/api", (_req, _res, next) =>
    next(new ApiError(404, "NOT_FOUND", "API endpoint not found.")),
  );
  if (production) {
    app.use(express.static(path.join(root, "dist")));
    app.get("/", (_req, res) =>
      res.sendFile(path.join(root, "dist", "index.html")),
    );
  }
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ApiError) {
        res.status(error.status).json({
          code: error.code,
          message: error.message,
          fields: error.fields,
        });
      } else if ((error as { type?: string })?.type === "entity.too.large") {
        res.status(413).json({
          code: "FILE_SIZE",
          message: "The upload or request body exceeds its size limit.",
        });
      } else if (error instanceof SyntaxError) {
        res.status(400).json({
          code: "INVALID",
          message: "The request contains invalid JSON.",
        });
      } else {
        console.error(
          "API operation failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
        res.status(500).json({
          code: "INTERNAL",
          message: "Unable to complete this operation. Please retry.",
        });
      }
    },
  );
  return app;
}
