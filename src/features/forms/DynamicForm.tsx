import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form, type FormType } from "@formio/react";
import type { FormDefinition } from "../../../shared/forms";
import type { Webform } from "@formio/js";
import type { Locale, RequestData } from "../../../shared/model";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { formTranslations } from "../../i18n";

// All renderer-specific integration stays here. Schema/data remain Form.io-shaped.
export function DynamicForm({
  definition,
  initialData,
  readOnly,
  locale,
  onReady,
  onDirty,
}: {
  definition: FormType | FormDefinition;
  initialData: RequestData;
  readOnly: boolean;
  locale: Locale;
  onReady: (instance: Webform) => void;
  onDirty: () => void;
}) {
  const instance = useRef<Webform | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const currentLocale = useRef(locale);
  currentLocale.current = locale;
  const submission = useMemo(
    () => ({ data: { ...initialData } }),
    [initialData],
  );
  const options = useMemo(
    () => ({
      readOnly,
      noAlerts: true,
      language: currentLocale.current,
      i18n: formTranslations,
    }),
    [readOnly],
  );
  const ready = useCallback(
    (form: Webform) => {
      instance.current = form;
      form.language = currentLocale.current;
      // Hydrate saved data and evaluate conditions before enabling save/review.
      void form
        .setSubmission(structuredClone(submission))
        .then(() => {
          if (instance.current !== form) return;
          const data = (form.submission as { data: RequestData }).data;
          form.checkConditions(data, {}, data);
          onReady(form);
        })
        .catch((cause: unknown) => {
          if (instance.current === form)
            setError(
              cause instanceof Error
                ? cause
                : new Error("Unable to initialize the form."),
            );
        });
    },
    [onReady, submission],
  );
  useEffect(() => {
    if (instance.current) instance.current.language = locale;
  }, [locale]);
  useEffect(
    () => () => {
      instance.current = null;
    },
    [],
  );
  return (
    <>
      {error && <ErrorNotice error={error} locale={locale} />}
      <Form
        className="formio-surface"
        src={definition as FormType}
        options={options}
        onFormReady={ready}
        onChange={(_value, _flags, modified) => {
          if (modified && !readOnly) onDirty();
        }}
      />
    </>
  );
}
