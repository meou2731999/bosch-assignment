import { uiCopy } from "../../i18n/ui";
import { useState, type ChangeEvent } from "react";
import {
  importFormDefinition,
  MAX_FORM_FILE_BYTES,
} from "../../../shared/form-import";
import type { FormDefinition } from "../../../shared/forms";
import type { Locale } from "../../../shared/model";
import { inputClass } from "../auth/AuthScreen";
export const FormJsonUpload = ({
  locale,
  onImport,
  onLoading,
}: Readonly<{
  locale: Locale;
  onImport: (definition: FormDefinition) => void;
  onLoading: (loading: boolean) => void;
}>) => {
  const [error, setError] = useState(false);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(false);
    onLoading(true);
    try {
      if (
        !file.name.toLowerCase().endsWith(".json") ||
        file.size > MAX_FORM_FILE_BYTES
      )
        throw new Error("file");
      const imported = importFormDefinition(JSON.parse(await file.text()));
      onImport(imported.definition);
    } catch {
      setError(true);
    } finally {
      onLoading(false);
    }
  };
  return (
    <div>
      <label>
        {uiCopy(locale).uploadJson}
        <input
          className={inputClass}
          type="file"
          accept=".json,application/json"
          onChange={upload}
          aria-describedby="form-json-hint"
        />
      </label>
      <p id="form-json-hint" className="text-muted">
        {uiCopy(locale).importHint}
      </p>
      <a
        href={`${import.meta.env.BASE_URL}examples/formio-example.json`}
        download="formio-example.json"
        className="text-brand underline"
      >
        {uiCopy(locale).downloadExample}
      </a>
      {error && <p role="alert">{uiCopy(locale).importError}</p>}
    </div>
  );
};
