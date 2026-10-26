import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Attachment, Locale, User } from "../../../shared/model";
import { MAX_ATTACHMENTS, MAX_FILE_BYTES } from "../../../shared/attachments";
import { copy } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { attachmentApi } from "./api";
import { FilePreview } from "./FilePreview";

export const AttachmentsPanel = ({
  user,
  requestId,
  formId,
  locale,
  attachments,
  readOnly,
  onChange,
  onUploading,
}: Readonly<{
  user: User;
  requestId: string;
  formId: string;
  locale: Locale;
  attachments: Attachment[];
  readOnly: boolean;
  onChange: (files: Attachment[]) => void;
  onUploading: (uploading: boolean) => void;
}>) => {
  const t = copy(locale);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Attachment | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const upload = async (files: File[]) => {
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
  };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void upload(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const removeAttachment = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };
  const emptyStatus = attachments.length ? "" : t.noFiles;
  const uploadStatus = uploading ? t.uploading : emptyStatus;
  return (
    <section
      aria-labelledby="attachments-heading"
      className="mt-6 border-t border-line pt-6"
    >
      <h2 id="attachments-heading" className="text-sm font-semibold">
        {t.attachments}
      </h2>
      <p id="file-help" className="max-w-xl text-xs leading-relaxed text-muted">
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
          onChange={handleFileChange}
          className="max-w-full text-xs file:mr-3 file:rounded-md file:border file:border-line file:bg-sage file:px-3 file:py-2"
        />
      )}
      <p role="status" className="mt-3 text-xs text-muted">
        {uploadStatus}
      </p>
      <ul className="m-0 list-none p-0">
        {attachments.map((file, index) => (
          <li
            key={file.id ?? `${file.name}-${index}`}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3"
          >
            <div className="min-w-0 flex-1">
              <strong className="block break-all text-sm font-medium">
                {file.name}
              </strong>
              <small className="text-muted">
                {Math.ceil(file.size / 1024)} KB
              </small>
              {!file.id && (
                <p className="mb-0 mt-1 text-xs text-amber-800">
                  {t.legacyFile}
                </p>
              )}
            </div>
            <div className="flex gap-2">
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
                  onClick={() => removeAttachment(index)}
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
};
