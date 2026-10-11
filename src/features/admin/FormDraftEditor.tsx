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
export function FormDraftEditor({
  existing,
  locale,
  busy,
  onSave,
  onCancel,
}: {
  existing?: FormRecord;
  locale: Locale;
  busy: boolean;
  onSave: (draft: FormDraft) => void;
  onCancel: () => void;
}) {
  const t = formCopy(locale),
    f = fieldCopy(locale);
  const [custom, setCustom] = useState(Boolean(existing?.draft.fields));
  const [fields, setFields] = useState<BasicField[]>(
    () => existing?.draft.fields ?? [],
  );
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (custom && !fieldsSchema.safeParse(fields).success) return;
    const data = new FormData(event.currentTarget);
    onSave({
      revision: existing?.draft.revision ?? 0,
      name: String(data.get("name")),
      description: String(data.get("description")),
      template: String(data.get("template")) as FormTemplate,
      ...(custom ? { fields } : {}),
    });
  }
  return (
    <section className="tw:space-y-4" aria-label={existing ? t.edit : t.create}>
      <form onSubmit={save}>
        <fieldset
          disabled={busy}
          className="editor-fields tw:space-y-5 tw:border-0 tw:p-0"
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
              defaultValue={existing?.draft.template ?? "request-v2"}
            >
              <option value="request-v1">{t.v1}</option>
              <option value="request-v2">{t.v2}</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={custom}
              onChange={(event) => setCustom(event.target.checked)}
            />
            {f.custom}
          </label>
          {custom && (
            <>
              <p>{f.hint}</p>
              <FieldsEditor
                fields={fields}
                locale={locale}
                onChange={setFields}
              />
            </>
          )}
          <div className="tw:flex tw:flex-wrap tw:gap-3">
            <Button
              type="submit"
              disabled={custom && !fieldsSchema.safeParse(fields).success}
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
}
