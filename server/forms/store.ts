import { fieldsSchema } from "../../shared/fields";
import { fieldDefinition } from "../../shared/field-definition";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  FormDefinition,
  FormRecord,
  FormTemplate,
  PublishedForm,
} from "../../shared/forms";
import { ApiError } from "../http/errors";
const draftSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000),
    template: z.enum(["request-v1", "request-v2"]),
    fields: fieldsSchema.optional(),
  })
  .strict();
export function createFormStore(dataDir: string, root: string) {
  mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, "forms.json");
  function loadTemplate(template: FormTemplate): FormDefinition {
    return JSON.parse(
      readFileSync(
        path.join(root, "forms", `${template.replace("-", ".")}.json`),
        "utf8",
      ),
    );
  }
  let records: FormRecord[];
  function persist(next: FormRecord[]) {
    writeFileSync(`${file}.tmp`, JSON.stringify(next, null, 2));
    renameSync(`${file}.tmp`, file);
    records = next;
  }
  try {
    records = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const { version: activeVersion } = JSON.parse(
      readFileSync(path.join(root, "forms", "active.json"), "utf8"),
    );
    if (![1, 2].includes(activeVersion))
      throw new Error("Invalid legacy active form version.", { cause: error });
    const at = new Date().toISOString();
    const versions = ([1, 2] as const).map((version) => {
      const template: FormTemplate =
        version === 1 ? "request-v1" : "request-v2";
      const definition = loadTemplate(template);
      return {
        formId: "request",
        version,
        name: definition.title,
        description: "IT equipment and software access requests",
        definition,
        validationProfile: template,
        publishedAt: at,
        publishedBy: "migration",
      };
    });
    persist([
      {
        id: "request",
        activeVersion,
        draft: {
          revision: 1,
          name: versions[activeVersion - 1].name,
          description: versions[0].description,
          template: activeVersion === 1 ? "request-v1" : "request-v2",
        },
        versions,
        audit: [],
      },
    ]);
  }
  function get(id: string) {
    const form = records.find((record) => record.id === id);
    if (!form) throw new ApiError(404, "NOT_FOUND", "Form type not found.");
    return structuredClone(form);
  }
  function published(id: string, version?: number): PublishedForm {
    const form = get(id);
    const selected = version ?? form.activeVersion;
    const entry = form.versions.find((item) => item.version === selected);
    if (!entry)
      throw new ApiError(404, "NOT_FOUND", "Published form version not found.");
    return entry;
  }
  function readDraft(raw: unknown) {
    const parsed = draftSchema.safeParse(raw);
    if (!parsed.success)
      throw new ApiError(422, "INVALID", "Invalid form draft.");
    return parsed.data;
  }
  return {
    all: () => structuredClone(records),
    get,
    published,
    create(raw: unknown, actorId: string) {
      const draft = readDraft(raw);
      if (draft.revision !== 0)
        throw new ApiError(409, "CONFLICT", "New form revision must be zero.");
      const form: FormRecord = {
        id: randomUUID(),
        activeVersion: null,
        draft: { ...draft, revision: 1 },
        versions: [],
        audit: [{ action: "created", actorId, at: new Date().toISOString() }],
      };
      persist([...records, form]);
      return structuredClone(form);
    },
    save(id: string, raw: unknown, actorId: string) {
      const form = get(id);
      const draft = readDraft(raw);
      if (draft.revision !== form.draft.revision)
        throw new ApiError(
          409,
          "CONFLICT",
          "A newer form draft exists. Reload before editing.",
        );
      form.draft = { ...draft, revision: draft.revision + 1 };
      form.audit.push({
        action: "draft_saved",
        actorId,
        at: new Date().toISOString(),
      });
      persist(records.map((record) => (record.id === id ? form : record)));
      return structuredClone(form);
    },
    publish(id: string, raw: unknown, actorId: string) {
      const parsed = z
        .object({ revision: z.number().int().positive() })
        .strict()
        .safeParse(raw);
      if (!parsed.success)
        throw new ApiError(422, "INVALID", "Supply the form draft revision.");
      const form = get(id);
      if (parsed.data.revision !== form.draft.revision)
        throw new ApiError(
          409,
          "CONFLICT",
          "A newer form draft exists. Reload before publishing.",
        );
      const version =
        Math.max(0, ...form.versions.map((item) => item.version)) + 1;
      const at = new Date().toISOString();
      const definition = form.draft.fields
        ? fieldDefinition(form.draft.name, form.draft.fields)
        : loadTemplate(form.draft.template);
      definition.title = form.draft.name;
      form.versions.push({
        formId: id,
        version,
        name: form.draft.name,
        description: form.draft.description,
        definition,
        validationProfile: form.draft.template,
        ...(form.draft.fields
          ? { fields: structuredClone(form.draft.fields) }
          : {}),
        publishedAt: at,
        publishedBy: actorId,
      });
      form.activeVersion = version;
      form.draft.revision++;
      form.audit.push({ action: "published", actorId, at, version });
      persist(records.map((record) => (record.id === id ? form : record)));
      return structuredClone(form);
    },
  };
}
export type FormStore = ReturnType<typeof createFormStore>;
