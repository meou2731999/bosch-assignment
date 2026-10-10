import { useCallback, useEffect, useMemo, useRef } from "react";
import { Form, type FormType } from "@formio/react";
import type { FormDefinition } from "../../../shared/forms";
import type { ComponentProps } from "react";
import type { Webform } from "@formio/js";
import type { Locale, RequestData } from "../../../shared/model";
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
      onReady(form);
    },
    [onReady],
  );
  useEffect(() => {
    if (instance.current) instance.current.language = locale;
  }, [locale]);
  return (
    <Form
      className="formio-surface"
      src={definition as FormType}
      submission={submission as ComponentProps<typeof Form>["submission"]}
      options={options}
      onFormReady={ready}
      onChange={(_value, _flags, modified) => {
        if (modified && !readOnly) onDirty();
      }}
    />
  );
}
