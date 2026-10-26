import { useState } from "react";
import { DraftHistory } from "../history/DraftHistory";
import { DemoControls } from "./DemoControls";
import { RequestActions } from "./RequestActions";
import { RequestMetadata } from "./RequestMetadata";
import { hasFormPermission } from "../../../../shared/forms";
import { AttachmentsPanel } from "../../attachments/AttachmentsPanel";
import { ErrorNotice } from "../../../components/ui/ErrorNotice";
import { ReviewPanel } from "./ReviewPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { useRequestEditor, type RequestEditorProps } from "./useRequestEditor";
import { copy } from "../../../i18n";
import { DynamicForm } from "../../forms/DynamicForm";
export const RequestEditor = ({
  user,
  locale,
  definition,
  record,
  onDirty,
  onBusy,
  onSaved,
  reload,
}: Readonly<RequestEditorProps>) => {
  const t = copy(locale);
  const [historyBusy, setHistoryBusy] = useState(false);
  const {
    readOnly,
    dirty,
    id,
    initialData,
    attachments,
    setAttachments,
    ready,
    saving,
    fail,
    setFail,
    error,
    uploading,
    onReady,
    markDirty,
    onUploading,
    save,
    saveStatus,
  } = useRequestEditor({
    user,
    locale,
    definition,
    record,
    onDirty,
    onBusy,
    onSaved,
    reload,
  });
  const changeAttachments = (next: typeof attachments) => {
    setAttachments(next);
    markDirty();
  };
  const changeHistoryBusy = (value: boolean) => {
    setHistoryBusy(value);
    onBusy(value);
  };
  return (
    <>
      <section
        className="overflow-hidden rounded-xl border border-line bg-white shadow-sm"
        aria-label={t.newRequest}
      >
        <RequestMetadata
          locale={locale}
          user={user}
          record={record}
          definition={definition}
        />
        {readOnly && (
          <div className="bg-slate-100 px-5 py-3 text-xs text-slate-600 md:px-7">
            {t.readonly}
          </div>
        )}
        {error && (
          <div className="px-5 pt-4 md:px-7">
            <ErrorNotice error={error} locale={locale} reload={reload} />
          </div>
        )}
        <fieldset
          disabled={saving || uploading || historyBusy}
          className="min-w-0 border-0 px-5 pt-6 pb-4 md:px-7"
        >
          <DynamicForm
            fields={definition.fields}
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
            onChange={changeAttachments}
            onUploading={onUploading}
          />
        </fieldset>
        {!readOnly && (
          <RequestActions
            locale={locale}
            saveStatus={saveStatus}
            ready={ready && !historyBusy}
            saving={saving || historyBusy}
            uploading={uploading}
            save={save}
          />
        )}
      </section>
      {!readOnly && (
        <DemoControls
          locale={locale}
          fail={fail}
          saving={saving || historyBusy}
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
      {record && !readOnly && (
        <DraftHistory
          record={record}
          user={user}
          locale={locale}
          disabled={!ready || saving || uploading}
          dirty={dirty}
          onBusy={changeHistoryBusy}
          onSaved={onSaved}
          reload={reload}
        />
      )}
      {record && <ActivityTimeline events={record.audit} locale={locale} />}
    </>
  );
};
