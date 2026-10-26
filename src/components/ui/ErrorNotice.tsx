import { useEffect, useRef } from "react";
import type { Locale } from "../../../shared/model";
import { HttpError } from "../../lib/http";
import { copy } from "../../i18n";
import { Button } from "./Button";

export const ErrorNotice = ({
  error,
  locale,
  reload,
}: Readonly<{
  error: Error;
  locale: Locale;
  reload?: () => void;
}>) => {
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
      className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
    >
      <strong>{t.errorTitle}</strong>
      <p className="my-2">{error.message}</p>
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
};
