import { translateValidation } from "../../../../shared/i18n/validation";
import { useCallback, useRef, useState } from "react";
import type { DraftPreview } from "../../../../shared/draft-history";
import type { Locale } from "../../../../shared/model";
import { Button } from "../../../components/ui/Button";
import { DynamicForm } from "../../forms/DynamicForm";
import { historyCopy } from "./copy";
import type { FormHandle } from "../../forms/FormHandle";
export const MigrationPreview = ({
  preview,
  locale,
  busy,
  onApply,
  onValidate,
  onCancel,
}: Readonly<{
  preview: DraftPreview;
  locale: Locale;
  busy: boolean;
  onApply: () => void;
  onValidate: (data: Record<string, unknown>) => Promise<boolean>;
  onCancel: () => void;
}>) => {
  const [confirmed, setConfirmed] = useState(false);
  const t = historyCopy(locale);
  const [changed, setChanged] = useState(false);
  const [ready, setReady] = useState(false);
  const form = useRef<FormHandle | null>(null);
  const onReady = useCallback((instance: FormHandle) => {
    form.current = instance;
    setReady(true);
  }, []);
  const blocked =
    preview.operation === "upgrade" &&
    (changed || Object.keys(preview.submissionErrors).length > 0);
  const check = async () => {
    if (!form.current) return;
    if (
      await onValidate(
        (form.current.submission as { data: Record<string, unknown> }).data,
      )
    ) {
      setChanged(false);
      setConfirmed(false);
    }
  };
  return (
    <section
      aria-label={t.preview}
      className="ui-form-stack rounded-lg border border-line bg-white p-4"
    >
      <h3>{t.preview}</h3>
      <p>
        {t.from}: {preview.fromVersion} → {t.to}: {preview.toVersion}
      </p>
      <h4>{t.schema}</h4>
      {preview.schemaChanges.length ? (
        <ul>
          {preview.schemaChanges.map((change) => (
            <li key={change.path}>
              <strong>
                {change.path}: {t[change.kind]}
              </strong>
              <details>
                <summary>
                  {t.before} / {t.after}
                </summary>
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(
                    { before: change.before, after: change.after },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t.noChanges}</p>
      )}
      <h4>{t.data}</h4>
      {preview.dataChanges.length ? (
        <table className="w-full">
          <thead>
            <tr>
              <th>{t.field}</th>
              <th>{t.before}</th>
              <th>{t.after}</th>
            </tr>
          </thead>
          <tbody>
            {preview.dataChanges.map((change) => (
              <tr key={change.path}>
                <td>
                  {change.path}: {t[change.kind]}
                </td>
                <td className="break-all">
                  {change.before === undefined
                    ? "—"
                    : JSON.stringify(change.before)}
                </td>
                <td className="break-all">
                  {change.kind === "removed"
                    ? "—"
                    : JSON.stringify(change.after)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{t.noChanges}</p>
      )}
      {Object.keys(preview.submissionErrors).length > 0 && (
        <div>
          <p>
            {preview.operation === "upgrade"
              ? t.incomplete
              : t.restoreIncomplete}
          </p>
          <ul>
            {Object.entries(preview.submissionErrors).map(([path, message]) => (
              <li key={path}>
                {path}: {translateValidation(message, locale)}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p>
        {t.files}:{" "}
        {preview.attachments.map((file) => file.name).join(", ") || "—"}
      </p>
      <h4>{t.candidate}</h4>
      <fieldset disabled={busy}>
        <DynamicForm
          useFormio={Boolean(preview.target.uploadedDefinition)}
          definition={preview.target.definition}
          fields={preview.target.fields}
          initialData={preview.data}
          readOnly={preview.operation === "restore"}
          locale={locale}
          onReady={onReady}
          onDirty={() => {
            setChanged(true);
            setConfirmed(false);
          }}
        />
      </fieldset>
      {preview.operation === "upgrade" && (
        <>
          <p>{t.correct}</p>
          <Button
            variant="secondary"
            disabled={busy || !ready}
            onClick={() => void check()}
          >
            {t.validate}
          </Button>
        </>
      )}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={busy || blocked}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {t.confirm}
      </label>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !confirmed || blocked} onClick={onApply}>
          {t.apply}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </section>
  );
};
