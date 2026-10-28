import { uiCopy } from "../../../i18n/ui";
import { useState } from "react";
import type { RequestRecord, User, Locale } from "../../../../shared/model";
import { type Definition } from "../api";
import { useDraftHistory } from "./useDraftHistory";
import { historyCopy } from "./copy";
import { MigrationPreview } from "./MigrationPreview";
import { ErrorNotice } from "../../../components/ui/ErrorNotice";
import { Button } from "../../../components/ui/Button";
import { inputClass } from "../../auth/AuthScreen";
export const DraftHistory = ({
  record,
  user,
  locale,
  disabled,
  dirty,
  onBusy,
  onSaved,
  reload,
}: Readonly<{
  record: RequestRecord;
  user: User;
  locale: Locale;
  disabled: boolean;
  dirty: boolean;
  onBusy: (busy: boolean) => void;
  onSaved: (record: RequestRecord, definition?: Definition) => void;
  reload: () => void;
}>) => {
  const t = historyCopy(locale);
  const [selected, setSelected] = useState("");
  const {
    latest,
    snapshots,
    loading,
    busy,
    error,
    preview,
    refresh,
    cancel,
    show,
    apply,
    validate,
  } = useDraftHistory({ record, user, onBusy, onSaved });
  return (
    <section
      aria-label={t.title}
      className="mt-5 ui-form-stack rounded-xl border border-line p-4"
    >
      <h2>{t.title}</h2>
      <p>{t.hint}</p>
      {loading && <p>{t.loading}</p>}
      {error && (
        <ErrorNotice
          error={error}
          locale={locale}
          reload={() => {
            cancel();
            reload();
          }}
        />
      )}
      {dirty && <p>{t.savedOnly}</p>}
      {!preview && (
        <Button
          variant="secondary"
          disabled={disabled || dirty || busy || loading}
          onClick={() => void refresh()}
        >
          {t.refresh}
        </Button>
      )}
      {latest && !preview && (
        <>
          <p>
            {t.current}: {record.formVersion} · {t.latest}: {latest.version}
          </p>
          {latest.version > record.formVersion && (
            <Button
              variant="secondary"
              disabled={disabled || dirty || busy || loading}
              onClick={() => void show()}
            >
              {t.upgrade}
            </Button>
          )}
          <label>
            {t.snapshot}
            <select
              className={inputClass}
              aria-label={t.snapshot}
              value={selected}
              disabled={disabled || dirty || busy}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">{t.choose}</option>
              {[...snapshots].reverse().map((item) => (
                <option key={item.revision} value={item.revision}>
                  {uiCopy(locale).revisionPrefix}
                  {item.revision} · {uiCopy(locale).versionPrefix}
                  {item.formVersion} ·{" "}
                  {new Date(item.at).toLocaleString(uiCopy(locale).dateLocale)}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            disabled={!selected || disabled || dirty || busy}
            onClick={() => void show(Number(selected))}
          >
            {t.restore}
          </Button>
        </>
      )}
      {preview && (
        <MigrationPreview
          key={preview.token}
          preview={preview}
          locale={locale}
          busy={busy}
          onApply={() => void apply()}
          onValidate={validate}
          onCancel={cancel}
        />
      )}
    </section>
  );
};
