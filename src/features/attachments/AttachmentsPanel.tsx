import { useEffect, useRef, useState } from "react";
import type { Attachment, Locale, User } from "../../../shared/model";
import { MAX_ATTACHMENTS, MAX_FILE_BYTES } from "../../../shared/attachments";
import { copy } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { attachmentApi } from "./api";
import { FilePreview } from "./FilePreview";

export function AttachmentsPanel({
  user,
  requestId,
  formId,
  locale,
  attachments,
  readOnly,
  onChange,
  onUploading,
}: {
  user: User;
  requestId: string;
  formId: string;
  locale: Locale;
  attachments: Attachment[];
  readOnly: boolean;
  onChange: (files: Attachment[]) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const t = copy(locale);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(files: File[]) {
    if (!files.length || controller.current) return;
    if (
      attachments.length + files.length > MAX_ATTACHMENTS ||
      files.some(
        (f) =>
          !f.size ||
          f.size > MAX_FILE_BYTES ||
          f.name.length > 120 ||
          !/\.(pdf|png|jpe?g|txt)$/i.test(f.name),
      )
    ) {
      setError(new Error(t.fileError));
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    setUploading(true);
    onUploading(true);
    setError(null);
    const next = [...attachments];
    try {
      for (const file of files) {
        const uploaded = await attachmentApi.upload(
          user,
          requestId,
          formId,
          file,
          abort.signal,
        );
        if (abort.signal.aborted) return;
        next.push(uploaded);
        onChange([...next]); // Keep successful files if a later upload fails.
      }
    } catch (e) {
      if (!abort.signal.aborted) setError(e as Error);
    } finally {
      controller.current = null;
      if (!abort.signal.aborted) {
        setUploading(false);
        onUploading(false);
      }
    }
  }
  const emptyStatus = attachments.length ? "" : t.noFiles;
  const uploadStatus = uploading ? t.uploading : emptyStatus;
  return (
    <section
      aria-labelledby="attachments-heading"
      className="tw:mt-6 tw:border-t tw:border-line tw:pt-6"
    >
      <h2 id="attachments-heading" className="tw:text-sm tw:font-semibold">
        {t.attachments}
      </h2>
      <p
        id="file-help"
        className="tw:max-w-xl tw:text-xs tw:leading-relaxed tw:text-muted"
      >
        {t.fileHint}
      </p>
      {error && <ErrorNotice error={error} locale={locale} />}
      {!readOnly && (
        <input
          aria-label={t.attachments}
          aria-describedby="file-help"
          type="file"
          multiple
          disabled={uploading}
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => {
            void upload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          className="tw:max-w-full tw:text-xs tw:file:mr-3 tw:file:rounded-md tw:file:border tw:file:border-line tw:file:bg-sage tw:file:px-3 tw:file:py-2"
        />
      )}
      <p role="status" className="tw:mt-3 tw:text-xs tw:text-muted">
        {uploadStatus}
      </p>
      <ul className="tw:m-0 tw:list-none tw:p-0">
        {attachments.map((file, index) => (
          <li
            key={file.id ?? `${file.name}-${index}`}
            className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-line tw:py-3"
          >
            <div className="tw:min-w-0 tw:flex-1">
              <strong className="tw:block tw:break-all tw:text-sm tw:font-medium">
                {file.name}
              </strong>
              <small className="tw:text-muted">
                {Math.ceil(file.size / 1024)} KB
              </small>
              {!file.id && (
                <p className="tw:mb-0 tw:mt-1 tw:text-xs tw:text-amber-800">
                  {t.legacyFile}
                </p>
              )}
            </div>
            <div className="tw:flex tw:gap-2">
              {file.id && (
                <Button
                  variant="secondary"
                  onClick={() => setPreview(file)}
                  aria-label={`${t.viewFile}: ${file.name}`}
                >
                  {t.viewFile}
                </Button>
              )}
              {!readOnly && (
                <Button
                  variant="danger"
                  disabled={uploading}
                  aria-label={`${t.remove} ${file.name}`}
                  onClick={() =>
                    onChange(attachments.filter((_, i) => i !== index))
                  }
                >
                  {t.remove}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {preview && (
        <FilePreview
          file={preview}
          user={user}
          locale={locale}
          onClose={() => setPreview(null)}
        />
      )}
    </section>
  );
}
