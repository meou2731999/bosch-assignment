import { useState, type FormEvent } from "react";
import type {
  FormDraft,
  FormRecord,
  FormTemplate,
} from "../../../shared/forms";
import { fieldsSchema, type BasicField } from "../../../shared/fields";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { inputClass } from "../auth/AuthScreen";
import { formCopy } from "../forms/copy";
import { fieldCopy } from "./fields/copy";
import { FieldsEditor } from "./fields/FieldsEditor";
export const FormDraftEditor = ({
  existing,
  locale,
  busy,
  onSave,
  onCancel,
}: Readonly<{
  existing?: FormRecord;
  locale: Locale;
  busy: boolean;
  onSave: (draft: FormDraft) => void;
  onCancel: () => void;
}>) => {
  const t = formCopy(locale),
    f = fieldCopy(locale);
  const [template, setTemplate] = useState<FormTemplate>(
    existing?.draft.template ?? "request-v2",
  );
  const [custom, setCustom] = useState(Boolean(existing?.draft.fields));
  const [fields, setFields] = useState<BasicField[]>(
    () => existing?.draft.fields ?? [],
  );
  const usesFields = template === "blank" || custom;
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (usesFields && !fieldsSchema.safeParse(fields).success) return;
    const data = new FormData(event.currentTarget);
    onSave({
      revision: existing?.draft.revision ?? 0,
      name: String(data.get("name")),
      description: String(data.get("description")),
      template,
      ...(usesFields ? { fields } : {}),
    });
  };
  return (
    <section className="space-y-4" aria-label={existing ? t.edit : t.create}>
      <form onSubmit={save}>
        <fieldset
          disabled={busy}
          className="editor-fields ui-form-stack border-0 p-0"
        >
          <label>
            {t.name}
            <input
              className={inputClass}
              name="name"
              required
              maxLength={120}
              defaultValue={existing?.draft.name}
            />
          </label>
          <label>
            {t.description}
            <textarea
              className={inputClass}
              name="description"
              maxLength={1000}
              defaultValue={existing?.draft.description}
            />
          </label>
          <label>
            {t.template}
            <select
              className={inputClass}
              name="template"
              aria-label={t.template}
              value={template}
              onChange={(event) =>
                setTemplate(event.target.value as FormTemplate)
              }
            >
              <option value="blank">{t.blank}</option>
              <option value="request-v1">{t.v1}</option>
              <option value="request-v2">{t.v2}</option>
            </select>
          </label>
          {template !== "blank" && (
            <label>
              <input
                type="checkbox"
                checked={custom}
                onChange={(event) => setCustom(event.target.checked)}
              />
              {f.custom}
            </label>
          )}
          {usesFields && (
            <>
              <p>{f.hint}</p>
              <FieldsEditor
                fields={fields}
                locale={locale}
                onChange={setFields}
              />
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={usesFields && !fieldsSchema.safeParse(fields).success}
            >
              {t.save}
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
};
