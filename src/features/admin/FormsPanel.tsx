import { useEffect, useState, type FormEvent } from "react";
import type { FormRecord, FormTemplate } from "../../../shared/forms";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { inputClass } from "../auth/AuthScreen";
import { formsApi } from "../forms/api";
import { formCopy } from "../forms/copy";
export function FormsPanel({ locale }: { locale: Locale }) {
  const t = formCopy(locale);
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [editing, setEditing] = useState<FormRecord | "new" | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let live = true;
    formsApi
      .all()
      .then((next) => {
        if (live) setForms(next);
      })
      .catch((error) => {
        if (live) setError(error);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function act(operation: () => Promise<FormRecord>, message: string) {
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const next = await operation();
      setForms((current) => [
        ...current.filter((form) => form.id !== next.id),
        next,
      ]);
      setEditing(null);
      setNotice(message);
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = {
      revision: editing === "new" ? 0 : (editing as FormRecord).draft.revision,
      name: String(data.get("name")),
      description: String(data.get("description")),
      template: String(data.get("template")) as FormTemplate,
    };
    void act(
      () =>
        editing === "new"
          ? formsApi.create(draft)
          : formsApi.save((editing as FormRecord).id, draft),
      t.saved,
    );
  }
  const existing = editing && editing !== "new" ? editing : undefined;
  return (
    <main id="main" className="tw:mx-auto tw:max-w-6xl tw:p-5 tw:md:p-10">
      <div className="tw:flex tw:items-center tw:justify-between">
        <h1>{t.manage}</h1>
        <Button
          disabled={busy || loading}
          onClick={() => {
            setEditing("new");
            setError(null);
          }}
        >
          {t.create}
        </Button>
      </div>
      <p className="tw:text-muted">{t.templateHint}</p>
      {error && <ErrorNotice error={error} locale={locale} />}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">{t.working}</p>
      ) : (
        <ul className="tw:list-none tw:space-y-4 tw:p-0">
          {forms.map((form) => (
            <li
              key={form.id}
              className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-5"
            >
              <div>
                <h2 className="tw:text-lg">{form.draft.name}</h2>
                <p>
                  {t.version}: {form.activeVersion ?? t.unpublished} · {t.draft}
                  : {form.draft.revision}
                </p>
              </div>
              <div className="tw:flex tw:gap-3">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditing(form);
                    setError(null);
                  }}
                >
                  {t.edit}
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.confirm))
                      void act(
                        () => formsApi.publish(form.id, form.draft.revision),
                        t.published,
                      );
                  }}
                >
                  {t.publish}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <section
          className="tw:mt-6 tw:max-w-xl tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-6"
          aria-label={existing ? t.edit : t.create}
        >
          <h2>{existing ? t.edit : t.create}</h2>
          <form key={existing?.id ?? "new"} onSubmit={save}>
            <fieldset
              disabled={busy}
              className="tw:space-y-4 tw:border-0 tw:p-0 tw:[&_label]:block"
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
              <div className="tw:flex tw:gap-3">
                <Button type="submit">{t.save}</Button>
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  {t.cancel}
                </Button>
              </div>
            </fieldset>
          </form>
        </section>
      )}
    </main>
  );
}
