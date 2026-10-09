import { useEffect, useRef } from "react";
import type { Locale } from "../../../shared/model";
import { HttpError } from "../../lib/http";
import { copy } from "../../i18n";
import { Button } from "./Button";

export function ErrorNotice({
  error,
  locale,
  reload,
}: {
  error: Error;
  locale: Locale;
  reload?: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const t = copy(locale);
  useEffect(() => {
    box.current?.focus();
  }, [error]);
  return (
    <div
      ref={box}
      tabIndex={-1}
      role="alert"
      className="tw:mb-4 tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:p-4 tw:text-sm tw:text-red-900"
    >
      <strong>{t.errorTitle}</strong>
      <p className="tw:my-2">{error.message}</p>
      {error instanceof HttpError && Object.keys(error.fields).length > 0 && (
        <ul>
          {Object.entries(error.fields).map(([field, message]) => (
            <li key={field}>
              {field}: {message}
            </li>
          ))}
        </ul>
      )}
      {reload &&
        error instanceof HttpError &&
        ["CONFLICT", "LOCKED", "VERSION"].includes(error.code) && (
          <>
            <p>{t.reloadHint}</p>
            <Button variant="secondary" onClick={reload}>
              {t.back}
            </Button>
          </>
        )}
    </div>
  );
}
