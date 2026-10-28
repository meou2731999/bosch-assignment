import { ProcessLine } from "../../components/ui/ProcessLine";
import { uiCopy } from "../../i18n/ui";
import { useState, type FormEvent } from "react";
import type {
  FormDraft,
  FormDefinition,
  FormRecord,
  FormTemplate,
} from "../../../shared/forms";
import { importFormDefinition } from "../../../shared/form-import";
import { fieldsSchema, type BasicField } from "../../../shared/fields";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { inputClass } from "../auth/AuthScreen";
import { formCopy } from "../forms/copy";
import { fieldCopy } from "./fields/copy";
import { FormImportStep } from "./FormImportStep";
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
    existing?.draft.template ?? "blank",
  );
  const [custom, setCustom] = useState(Boolean(existing?.draft.fields));
  const [fields, setFields] = useState<BasicField[]>(
    () => existing?.draft.fields ?? [],
  );
  const [uploaded, setUploaded] = useState<FormDefinition | undefined>(
    existing?.draft.uploadedDefinition,
  );
  const [step, setStep] = useState(existing ? 2 : 1);

  const [reading, setReading] = useState(false);
  const [name, setName] = useState(existing?.draft.name ?? "");
  const [description, setDescription] = useState(
    existing?.draft.description ?? "",
  );
  const [importRevision, setImportRevision] = useState(0);
  const usesFields = template === "blank" || custom;
  const changeFields = (next: BasicField[]) => {
    setFields(next);
    setUploaded(undefined);
  };
  const importDefinition = (definition: FormDefinition) => {
    const imported = importFormDefinition(definition);
    setFields(imported.fields);
    setImportRevision((revision) => revision + 1);
    setUploaded(imported.definition);
    setName(definition.title);
    setDescription("");
    setTemplate("blank");
  };
  const nextStep = () => setStep(2);
  const skipImport = () => {
    setFields([]);
    setUploaded(undefined);
    setName("");
    setDescription("");
    setTemplate("blank");
    setStep(2);
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
      ...(usesFields && !uploaded ? { fields } : {}),
      ...(uploaded ? { uploadedDefinition: uploaded } : {}),
    });
  };
  return (
    <section className="space-y-4" aria-label={existing ? t.edit : t.create}>
      {!existing && (
        <ProcessLine
          steps={[t.uploadLabel, t.editorLabel]}
          current={step - 1}
          label={t.create}
        />
      )}
      {step === 1 ? (
        <FormImportStep
          locale={locale}
          busy={busy || reading}
          selectedTitle={uploaded?.title}
          onImport={importDefinition}
          onLoading={setReading}
          onNext={nextStep}
          onSkip={skipImport}
          onCancel={onCancel}
        />
      ) : (
        <form onSubmit={save}>
          <fieldset
            disabled={busy || reading}
            className="editor-fields ui-form-stack border-0 p-0"
          >
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
                {uploaded && (
                  <p className="text-muted">{uiCopy(locale).importEditHint}</p>
                )}
                <FieldsEditor
                  key={importRevision}
                  fields={fields}
                  locale={locale}
                  onChange={changeFields}
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
      )}
    </section>
  );
};
