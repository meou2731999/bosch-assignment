import { Modal } from "../../components/ui/Modal";
import { useEffect, useState } from "react";
import type { FormRecord, FormDraft } from "../../../shared/forms";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { FormDraftEditor } from "./FormDraftEditor";
import { formsApi } from "../forms/api";
import { formCopy } from "../forms/copy";
export function FormsPanel({ locale }: Readonly<{ locale: Locale }>) {
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
  function save(draft: FormDraft) {
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
    <main id="main" className="mx-auto max-w-6xl p-5 md:p-10">
      <div className="flex items-center justify-between">
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
      <p className="text-muted">{t.templateHint}</p>
      {error && !editing && <ErrorNotice error={error} locale={locale} />}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p role="status">{t.working}</p>
      ) : (
        <ul className="list-none space-y-4 p-0">
          {forms.map((form) => (
            <li
              key={form.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-5"
            >
              <div>
                <h2 className="text-lg">{form.draft.name}</h2>
                <p>
                  {t.version}: {form.activeVersion ?? t.unpublished} · {t.draft}
                  : {form.draft.revision}
                </p>
              </div>
              <div className="flex gap-3">
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
        <Modal
          title={existing ? t.edit : t.create}
          locale={locale}
          busy={busy}
          wide
          onClose={() => {
            setEditing(null);
            setError(null);
          }}
        >
          {error && <ErrorNotice error={error} locale={locale} />}
          <FormDraftEditor
            key={existing?.id ?? "new"}
            existing={existing}
            locale={locale}
            busy={busy}
            onSave={save}
            onCancel={() => {
              setEditing(null);
              setError(null);
            }}
          />
        </Modal>
      )}
    </main>
  );
}
