import { apiMessages } from "../../shared/i18n/api-en";
import type { Express } from "express";
import { z } from "zod";
import { canAccessForm, hasFormPermission } from "../../shared/forms";
import type { UserStore } from "../auth/users";
import { publicAccount } from "../auth/users";
import { ApiError } from "../http/errors";
import type { FormStore } from "./store";
export function registerFormRoutes(
  app: Express,
  forms: FormStore,
  users: UserStore,
) {
  app.get("/api/forms", (_req, res) => {
    const user = res.locals.user;
    res.json(
      forms
        .all()
        .filter(
          (form) => form.activeVersion !== null && canAccessForm(user, form.id),
        )
        .map((form) => {
          const active = forms.published(form.id);
          return {
            id: form.id,
            name: active.name,
            description: active.description,
            activeVersion: active.version,
            permissions: (["create", "view", "review"] as const).filter(
              (permission) => hasFormPermission(user, form.id, permission),
            ),
          };
        }),
    );
  });
  app.get("/api/forms/:id/versions/:version", (req, res) => {
    if (!canAccessForm(res.locals.user, String(req.params.id)))
      throw new ApiError(404, "NOT_FOUND", apiMessages.formTypeNotFound);
    res.json(
      forms.published(String(req.params.id), Number(req.params.version)),
    );
  });
  app.get("/api/forms/:id", (req, res) => {
    if (!canAccessForm(res.locals.user, String(req.params.id)))
      throw new ApiError(404, "NOT_FOUND", apiMessages.formTypeNotFound);
    res.json(forms.published(String(req.params.id)));
  });
  // registerAuth already protects every /api/admin endpoint with the admin check.
  app.get("/api/admin/forms", (_req, res) => res.json(forms.all()));
  app.get("/api/admin/forms/:id", (req, res) =>
    res.json(forms.get(String(req.params.id))),
  );
  app.post("/api/admin/forms", (req, res) =>
    res.status(201).json(forms.create(req.body, res.locals.user.id)),
  );
  app.put("/api/admin/forms/:id/draft", (req, res) =>
    res.json(forms.save(String(req.params.id), req.body, res.locals.user.id)),
  );
  app.post("/api/admin/forms/:id/publish", (req, res) =>
    res.json(
      forms.publish(String(req.params.id), req.body, res.locals.user.id),
    ),
  );
  app.put("/api/admin/users/:id/form-permissions", (req, res) => {
    const parsed = z
      .object({
        revision: z.number().int().nonnegative(),
        formPermissions: z.record(
          z.string(),
          z
            .array(z.enum(["create", "view", "review"]))
            .max(3)
            .refine((values) => new Set(values).size === values.length),
        ),
      })
      .strict()
      .safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", apiMessages.invalidFormPermissions);
    const grants = Object.entries(parsed.data.formPermissions);
    if (grants.length > 100)
      throw new ApiError(422, "INVALID", apiMessages.tooManyFormGrants);
    for (const [formId] of grants) forms.get(formId);
    const permissions = Object.fromEntries(
      grants.filter(([, values]) => values.length > 0),
    );
    res.json(
      publicAccount(
        users.setPermissions(
          String(req.params.id),
          permissions,
          parsed.data.revision,
          res.locals.user.id,
        ),
      ),
    );
  });
}
