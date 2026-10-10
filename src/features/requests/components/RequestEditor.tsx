import { DemoControls } from "./DemoControls";
import { RequestActions } from "./RequestActions";
import { RequestMetadata } from "./RequestMetadata";
import { hasFormPermission } from "../../../../shared/forms";
import { AttachmentsPanel } from "../../attachments/AttachmentsPanel";
import { ErrorNotice } from "../../../components/ui/ErrorNotice";
import { ReviewPanel } from "./ReviewPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { useCallback, useRef, useState } from "react";
import type { Webform } from "@formio/js";
import {
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
    !hasFormPermission(user, definition.formId, "create") ||
    (!!record && (record.ownerId !== user.id || record.status !== "draft"));
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
  const [uploading, setUploading] = useState(false);
  const onReady = useCallback((instance: Webform) => {
    form.current = instance;
    setReady(true);
  }, []);
  const markDirty = useCallback(() => {
    setDirty(true);
    onDirty(true);
  }, [onDirty]);
  const onUploading = useCallback(
    (value: boolean) => {
      setUploading(value);
      onBusy(value);
      if (value) markDirty();
    },
    [onBusy, markDirty],
  );

  async function save(action: "draft" | "submit") {
    if (!form.current || saving || uploading || readOnly) return;
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
          formId: definition.formId,
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
  const idleStatus = dirty ? t.dirty : t.help;
  const saveStatus = saving ? t.saving : idleStatus;
  return (
    <>
      <section
        className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-line tw:bg-white tw:shadow-sm"
        aria-label={t.newRequest}
      >
        <RequestMetadata
          locale={locale}
          user={user}
          record={record}
          definition={definition}
        />
        {readOnly && (
          <div className="tw:bg-slate-100 tw:px-5 tw:py-3 tw:text-xs tw:text-slate-600 tw:md:px-7">
            {t.readonly}
          </div>
        )}
        {error && (
          <div className="tw:px-5 tw:pt-4 tw:md:px-7">
            <ErrorNotice error={error} locale={locale} reload={reload} />
          </div>
        )}
        <fieldset
          disabled={saving || uploading}
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
          <AttachmentsPanel
            user={user}
            requestId={id}
            formId={definition.formId}
            locale={locale}
            attachments={attachments}
            readOnly={readOnly}
            onChange={(next) => {
              setAttachments(next);
              markDirty();
            }}
            onUploading={onUploading}
          />
        </fieldset>
        {!readOnly && (
          <RequestActions
            locale={locale}
            saveStatus={saveStatus}
            ready={ready}
            saving={saving}
            uploading={uploading}
            save={save}
          />
        )}
      </section>
      {!readOnly && (
        <DemoControls
          locale={locale}
          fail={fail}
          saving={saving}
          onChange={setFail}
        />
      )}
      {record &&
        hasFormPermission(user, record.formId, "review") &&
        record.ownerId !== user.id &&
        ["submitted", "in_review"].includes(record.status) && (
          <ReviewPanel
            user={user}
            record={record}
            locale={locale}
            onSaved={onSaved}
            onBusy={onBusy}
            onDirty={onDirty}
            reload={reload}
          />
        )}
      {record && <ActivityTimeline events={record.audit} locale={locale} />}
    </>
  );
}
