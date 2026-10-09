import { ActivityTimeline } from "./ActivityTimeline";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Webform } from "@formio/js";
import {
  USERS,
  type Attachment,
  type Locale,
  type RequestData,
  type RequestRecord,
  type User,
} from "../../../../shared/model";
import { api, HttpError, type Definition } from "../api";
import { copy } from "../../../i18n";
import { DynamicForm } from "../../forms/DynamicForm";
export function RequestEditor({
  user,
  locale,
  definition,
  record,
  onDirty,
  onBusy,
  onSaved,
  reload,
}: {
  user: User;
  locale: Locale;
  definition: Definition;
  record: RequestRecord | null;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onSaved: (record: RequestRecord) => void;
  reload: () => void;
}) {
  const t = copy(locale);
  const readOnly =
    user.role !== "requester" || (!!record && record.status !== "draft");
  const [id] = useState(() => record?.id ?? crypto.randomUUID());
  const [initialData] = useState(() => record?.data ?? {});
  const [attachments, setAttachments] = useState<Attachment[]>(
    record?.attachments ?? [],
  );
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fail, setFail] = useState(false);
  const [error, setError] = useState<HttpError | Error | null>(null);
  const form = useRef<Webform | null>(null);
  const errorBox = useRef<HTMLDivElement | null>(null);
  const onReady = useCallback((instance: Webform) => {
    form.current = instance;
    setReady(true);
  }, []);
  const markDirty = useCallback(() => {
    setDirty(true);
    onDirty(true);
  }, [onDirty]);
  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);

  async function save(action: "draft" | "submit") {
    if (!form.current || saving || readOnly) return;
    setError(null);
    setSaving(true);
    onBusy(true);
    try {
      let data = (form.current.submission as { data: RequestData }).data;
      if (action === "submit") {
        try {
          // Raw JSON uses Form.io's local validation path; our API owns persistence.
          const submission = await form.current.submit(false, {
            state: "submitted",
          });
          data = (submission as { data: RequestData }).data;
        } catch {
          throw new HttpError("CLIENT_VALIDATION", t.validation);
        }
      }
      const simulateFailure = fail;
      setFail(false);
      const next = await api.save(
        user,
        id,
        {
          revision: record?.revision ?? 0,
          formVersion: definition.version,
          action,
          data,
          attachments,
        },
        simulateFailure,
      );
      onSaved(next);
    } catch (e) {
      setError(e as Error);
    } finally {
      setSaving(false);
      onBusy(false);
    }
  }
  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = [
      ...attachments,
      ...Array.from(files, (f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    ];
    const types = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
    if (
      next.length > 3 ||
      next.some(
        (f) =>
          f.size <= 0 ||
          f.size > 5 * 1024 * 1024 ||
          f.name.length > 120 ||
          !types.includes(f.type),
      )
    ) {
      setError(new Error(t.fileError));
      return;
    }
    setError(null);
    setAttachments(next);
    markDirty();
  }
  const fields = error instanceof HttpError ? Object.entries(error.fields) : [];
  return (
    <>
      <section className="surface editor" aria-label={t.newRequest}>
        <div className="editor-meta">
          <span>
            {t.version} <strong>{definition.version}</strong>
          </span>
          <span>
            {t.revision} <strong>{record?.revision ?? 0}</strong>
          </span>
          <span className="owner">
            {t.requestOwner}{" "}
            <strong>
              {USERS.find((u) => u.id === record?.ownerId)?.name ?? user.name}
            </strong>
          </span>
        </div>
        {readOnly && <div className="read-only-note">{t.readonly}</div>}
        {error && (
          <div
            className="notice error"
            role="alert"
            tabIndex={-1}
            ref={errorBox}
          >
            <strong>{t.errorTitle}</strong>
            <p>{error.message}</p>
            {!!fields.length && (
              <ul>
                {fields.map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}
                  </li>
                ))}
              </ul>
            )}
            {error instanceof HttpError &&
              ["CONFLICT", "LOCKED", "VERSION"].includes(error.code) && (
                <>
                  <p>{t.reloadHint}</p>
                  <button className="button button-secondary" onClick={reload}>
                    {t.back}
                  </button>
                </>
              )}
          </div>
        )}
        <fieldset disabled={saving} className="form-fields">
          <DynamicForm
            definition={definition.definition}
            initialData={initialData}
            readOnly={readOnly}
            locale={locale}
            onReady={onReady}
            onDirty={markDirty}
          />
          <div className="attachment-area">
            <h2>{t.attachments}</h2>
            <p id="file-help" className="muted">
              {t.fileHint}
            </p>
            {!readOnly && (
              <input
                aria-label={t.attachments}
                aria-describedby="file-help"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            )}
            {!attachments.length && <p className="no-files">{t.noFiles}</p>}
            <ul className="attachment-list">
              {attachments.map((f, index) => (
                <li key={`${f.name}-${index}`}>
                  <span>
                    {f.name} <small>({Math.ceil(f.size / 1024)} KB)</small>
                  </span>
                  {!readOnly && (
                    <button
                      className="text-button"
                      aria-label={`${t.remove} ${f.name}`}
                      onClick={() => {
                        setAttachments(
                          attachments.filter((_, i) => i !== index),
                        );
                        markDirty();
                      }}
                    >
                      {t.remove}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </fieldset>
        {!readOnly && (
          <div className="form-actions">
            <span className="save-indicator" role="status">
              {saving ? t.saving : dirty ? t.dirty : t.help}
            </span>
            <div>
              <button
                className="button button-secondary"
                disabled={!ready || saving}
                onClick={() => void save("draft")}
              >
                {t.saveDraft}
              </button>
              <button
                className="button button-primary"
                disabled={!ready || saving}
                onClick={() => void save("submit")}
              >
                {t.submit} <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        )}
      </section>
      {!readOnly && (
        <details className="demo-controls">
          <summary>{t.demoTools}</summary>
          <label>
            <input
              type="checkbox"
              checked={fail}
              disabled={saving}
              onChange={(e) => setFail(e.target.checked)}
            />{" "}
            {t.fail}
          </label>
        </details>
      )}
      {record && <ActivityTimeline events={record.audit} locale={locale} />}
    </>
  );
}
