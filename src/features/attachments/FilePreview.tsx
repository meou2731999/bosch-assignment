import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Attachment, Locale, User } from "../../../shared/model";
import { copy } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { attachmentApi } from "./api";

export function FilePreview({
  file,
  user,
  locale,
  onClose,
}: {
  file: Attachment;
  user: User;
  locale: Locale;
  onClose: () => void;
}) {
  const t = copy(locale);
  const dialog = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<{ url: string; text?: string } | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    let url: string | undefined;
    void (async () => {
      try {
        const blob = await attachmentApi.content(user, file.id!, abort.signal);
        const text = file.type === "text/plain" ? await blob.text() : undefined;
        if (abort.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setContent({ url, text });
      } catch (e) {
        if (!abort.signal.aborted) setError(e as Error);
      }
    })();
    return () => {
      abort.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, user]);
  return createPortal(
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="file-preview-title"
      className="tw:m-auto tw:max-h-[92vh] tw:w-[min(960px,94vw)] tw:max-w-none tw:overflow-auto tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-0 tw:font-sans tw:text-ink tw:shadow-xl tw:backdrop:bg-slate-950/50"
    >
      <div className="tw:sticky tw:top-0 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:border-b tw:border-line tw:bg-white tw:p-4">
        <div className="tw:min-w-0">
          <p className="tw:mb-1 tw:text-xs tw:text-muted">{t.preview}</p>
          <h2
            id="file-preview-title"
            className="tw:mb-0 tw:break-all tw:text-base tw:font-semibold"
          >
            {file.name}
          </h2>
        </div>
        <Button variant="secondary" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <div className="tw:p-4">
        {error ? (
          <ErrorNotice error={error} locale={locale} />
        ) : !content ? (
          <p role="status">{t.loading}</p>
        ) : (
          <>
            {file.type === "text/plain" ? (
              <pre className="tw:max-h-[60vh] tw:overflow-auto tw:whitespace-pre-wrap tw:break-words tw:rounded-lg tw:bg-stone-50 tw:p-4 tw:text-sm">
                {content.text}
              </pre>
            ) : file.type.startsWith("image/") ? (
              <img
                src={content.url}
                alt={file.name}
                className="tw:mx-auto tw:max-h-[65vh] tw:max-w-full tw:object-contain"
              />
            ) : (
              <iframe
                src={content.url}
                title={`${t.preview}: ${file.name}`}
                className="tw:h-[65vh] tw:w-full tw:border-0"
              />
            )}
            <p className="tw:mt-4 tw:text-xs tw:text-muted">{t.previewHint}</p>
            <a
              href={content.url}
              download={file.name}
              className="tw:inline-flex tw:rounded-lg tw:bg-brand tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-white tw:no-underline"
            >
              {t.download}
            </a>
          </>
        )}
      </div>
    </dialog>,
    document.body,
  );
}
