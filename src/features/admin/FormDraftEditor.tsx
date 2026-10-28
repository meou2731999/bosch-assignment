import { useState, type FormEvent } from "react";
import type {
  FormDraft,
  FormDefinition,
  FormRecord,
  FormTemplate,
} from "../../../shared/forms";
import { fieldsSchema, type BasicField } from "../../../shared/fields";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { inputClass } from "../auth/AuthScreen";
import { formCopy } from "../forms/copy";
import { fieldCopy } from "./fields/copy";
import { FormJsonUpload } from "./FormJsonUpload";
import { DynamicForm } from "../forms/DynamicForm";
import { FieldsEditor } from "./fields/FieldsEditor";
const emptyData = {};
const noop = () => {};
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
    existing?.draft.template ?? "blank",
  );
  const [custom, setCustom] = useState(Boolean(existing?.draft.fields));
  const [fields, setFields] = useState<BasicField[]>(
    () => existing?.draft.fields ?? [],
  );
  const [uploaded, setUploaded] = useState<FormDefinition | undefined>(
    existing?.draft.uploadedDefinition,
  );
  const [reading, setReading] = useState(false);
  const [name, setName] = useState(existing?.draft.name ?? "");
  const [description, setDescription] = useState(
    existing?.draft.description ?? "",
  );
  const usesFields = !uploaded && (template === "blank" || custom);
  const importDefinition = (definition: FormDefinition) => {
    setUploaded(definition);
    setName(definition.title);
    setDescription("");
    setTemplate("blank");
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reading) return;
    if (usesFields && !fieldsSchema.safeParse(fields).success) return;
    const data = new FormData(event.currentTarget);
    onSave({
      revision: existing?.draft.revision ?? 0,
      name: String(data.get("name")),
      description: String(data.get("description")),
      template,
      ...(usesFields ? { fields } : {}),
      ...(uploaded ? { uploadedDefinition: uploaded } : {}),
    });
  };
  return (
    <section className="space-y-4" aria-label={existing ? t.edit : t.create}>
      <form onSubmit={save}>
        <fieldset
          disabled={busy || reading}
          className="editor-fields ui-form-stack border-0 p-0"
        >
          <FormJsonUpload
            locale={locale}
            onImport={importDefinition}
            onLoading={setReading}
          />
          <label>
            {t.name}
            <input
              className={inputClass}
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            {t.description}
            <textarea
              className={inputClass}
              name="description"
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          {!uploaded && (
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
          )}
          {uploaded && (
            <section
              aria-label={
                locale === "vi" ? "Xem trước biểu mẫu" : "Form preview"
              }
            >
              <DynamicForm
                definition={uploaded}
                initialData={emptyData}
                readOnly={false}
                locale={locale}
                onReady={noop}
                onDirty={noop}
              />
            </section>
          )}
          {!uploaded && template !== "blank" && (
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
