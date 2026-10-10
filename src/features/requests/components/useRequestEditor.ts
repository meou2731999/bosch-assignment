import { useCallback, useRef, useState } from "react";
import type { Webform } from "@formio/js";
import type {
  Attachment,
  Locale,
  RequestData,
  RequestRecord,
  User,
} from "../../../../shared/model";
import { hasFormPermission } from "../../../../shared/forms";
import { validateFields } from "../../../../shared/field-validation";
import { api, HttpError, type Definition } from "../api";
import { copy } from "../../../i18n";
export type RequestEditorProps = {
  user: User;
  locale: Locale;
  definition: Definition;
  record: RequestRecord | null;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onSaved: (record: RequestRecord) => void;
  reload: () => void;
};
export function useRequestEditor({
  user,
  locale,
  definition,
  record,
  onDirty,
  onBusy,
  onSaved,
}: RequestEditorProps) {
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
      if (definition.fields) {
        const checked = validateFields(
          definition.fields,
          data,
          action === "submit",
        );
        if (Object.keys(checked.errors).length)
          throw new HttpError(
            "CLIENT_VALIDATION",
            t.validation,
            checked.errors,
          );
        data = checked.data;
      }
      if (action === "submit" && !definition.fields) {
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
  return {
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
  };
}
