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
export function RequestEditor({
  user,
  locale,
  definition,
  record,
  onDirty,
  onBusy,
  onSaved,
  reload,
}: RequestEditorProps) {
  const t = copy(locale);
  const {
    readOnly,
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
