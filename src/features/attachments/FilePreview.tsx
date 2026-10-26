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
}: Readonly<{
  file: Attachment;
  user: User;
  locale: Locale;
  onClose: () => void;
}>) {
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
  function renderPreview() {
    if (!content) return null;
    if (file.type === "text/plain")
      return (
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-stone-50 p-4 text-sm">
          {content.text}
        </pre>
      );
    if (file.type.startsWith("image/"))
      return (
        <img
          src={content.url}
          alt={file.name}
          className="mx-auto max-h-[65vh] max-w-full object-contain"
        />
      );
    return (
      <iframe
        src={content.url}
        title={`${t.preview}: ${file.name}`}
        className="h-[65vh] w-full border-0"
      />
    );
  }
  function renderContent() {
    if (error) return <ErrorNotice error={error} locale={locale} />;
    if (!content) return <p role="status">{t.loading}</p>;
    return (
      <>
        {renderPreview()}
        <p className="mt-4 text-xs text-muted">{t.previewHint}</p>
        <a
          href={content.url}
          download={file.name}
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          {t.download}
        </a>
      </>
    );
  }
  return createPortal(
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="file-preview-title"
      className="m-auto max-h-[92vh] w-[min(960px,94vw)] max-w-none overflow-auto rounded-xl border border-line bg-white p-0 font-sans text-ink shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-line bg-white p-4">
        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted">{t.preview}</p>
          <h2
            id="file-preview-title"
            className="mb-0 break-all text-base font-semibold"
          >
            {file.name}
          </h2>
        </div>
        <Button variant="secondary" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <div className="p-4">{renderContent()}</div>
    </dialog>,
    document.body,
  );
}
