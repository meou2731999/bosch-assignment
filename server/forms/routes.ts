import type { Express } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ApiError } from "../http/errors";
export function registerFormRoutes(app: Express, root: string) {
  app.get("/api/forms/request", (_req, res, next) => {
    try {
      const config = JSON.parse(
        readFileSync(path.join(root, "forms", "active.json"), "utf8"),
      );
      res.json(loadDefinition(config.version));
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/forms/request/versions/:version", (req, res, next) => {
    try {
      res.json(loadDefinition(Number(req.params.version)));
    } catch (error) {
      next(error);
    }
  });
  function loadDefinition(version: number) {
    if (![1, 2].includes(version))
      throw new ApiError(404, "NOT_FOUND", "Form version not found.");
    const definition = JSON.parse(
      readFileSync(
        path.join(root, "forms", `request.v${version}.json`),
        "utf8",
      ),
    );
    // These are trusted author-managed fixtures, not a public schema ingestion endpoint.
    z.object({ components: z.array(z.record(z.string(), z.unknown())) }).parse(
      definition,
    );
    return { version, definition };
  }
}
