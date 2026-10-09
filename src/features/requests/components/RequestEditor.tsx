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
      <section
        className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-line tw:bg-white tw:shadow-sm"
        aria-label={t.newRequest}
      >
        <div className="tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:border-b tw:border-line tw:bg-stone-50 tw:px-5 tw:py-4 tw:text-xs tw:text-muted tw:md:px-7 tw:[&_strong]:ml-1 tw:[&_strong]:font-semibold tw:[&_strong]:text-ink">
          <span>
            {t.version} <strong>{definition.version}</strong>
          </span>
          <span>
            {t.revision} <strong>{record?.revision ?? 0}</strong>
          </span>
          <span className="tw:md:ml-auto">
            {t.requestOwner}{" "}
            <strong>
              {USERS.find((u) => u.id === record?.ownerId)?.name ?? user.name}
            </strong>
          </span>
        </div>
        {readOnly && (
          <div className="tw:bg-slate-100 tw:px-5 tw:py-3 tw:text-xs tw:text-slate-600 tw:md:px-7">
            {t.readonly}
          </div>
        )}
        {error && (
          <div
            className="tw:mb-5 tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:px-5 tw:py-4 tw:text-sm tw:text-red-900 tw:[&_p]:my-2 tw:[&_ul]:mb-0"
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
                  <button
                    className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:border-slate-300 tw:bg-white tw:text-brand tw:hover:bg-sage"
                    onClick={reload}
                  >
                    {t.back}
                  </button>
                </>
              )}
          </div>
        )}
        <fieldset
          disabled={saving}
          className="tw:min-w-0 tw:border-0 tw:px-5 tw:pt-6 tw:pb-4 tw:md:px-7"
        >
          <DynamicForm
            definition={definition.definition}
            initialData={initialData}
            readOnly={readOnly}
            locale={locale}
            onReady={onReady}
            onDirty={markDirty}
          />
          <div className="tw:mt-6 tw:border-t tw:border-line tw:pt-6 tw:[&_h2]:text-sm tw:[&_h2]:font-semibold tw:[&_input]:max-w-full tw:[&_input]:text-xs tw:[&_input]:file:mr-3 tw:[&_input]:file:rounded-md tw:[&_input]:file:border tw:[&_input]:file:border-line tw:[&_input]:file:bg-sage tw:[&_input]:file:px-3 tw:[&_input]:file:py-2">
            <h2>{t.attachments}</h2>
            <p
              id="file-help"
              className="tw:text-sm tw:leading-relaxed tw:text-muted"
            >
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
            {!attachments.length && (
              <p className="tw:mt-3 tw:text-xs tw:text-muted">{t.noFiles}</p>
            )}
            <ul className="tw:mt-3 tw:list-none tw:p-0 tw:text-sm tw:[&_li]:flex tw:[&_li]:items-center tw:[&_li]:justify-between tw:[&_li]:gap-3 tw:[&_li]:border-b tw:[&_li]:border-line tw:[&_li]:py-3 tw:[&_span]:break-all tw:[&_small]:text-muted">
              {attachments.map((f, index) => (
                <li key={`${f.name}-${index}`}>
                  <span>
                    {f.name} <small>({Math.ceil(f.size / 1024)} KB)</small>
                  </span>
                  {!readOnly && (
                    <button
                      className="tw:border-0 tw:bg-transparent tw:text-xs tw:text-red-800 tw:underline"
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
          <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-t tw:border-line tw:px-5 tw:py-5 tw:md:px-7 tw:[&>div]:flex tw:[&>div]:flex-wrap tw:[&>div]:gap-2">
            <span
              className="tw:max-w-xs tw:text-xs tw:text-muted"
              role="status"
            >
              {saving ? t.saving : dirty ? t.dirty : t.help}
            </span>
            <div>
              <button
                className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:border-slate-300 tw:bg-white tw:text-brand tw:hover:bg-sage"
                disabled={!ready || saving}
                onClick={() => void save("draft")}
              >
                {t.saveDraft}
              </button>
              <button
                className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:bg-brand tw:text-white tw:hover:bg-brand-hover"
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
        <details className="tw:mx-1 tw:mt-4 tw:mb-7 tw:text-xs tw:text-muted tw:[&_label]:block tw:[&_label]:pt-3 tw:[&_input]:mr-1 tw:[&_input]:accent-brand">
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
