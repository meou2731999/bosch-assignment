import type { FormDefinition } from "../../../shared/forms";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { formCopy } from "../forms/copy";
import { FormJsonUpload } from "./FormJsonUpload";

export const FormImportStep = ({
  locale,
  busy,
  selectedTitle,
  onImport,
  onLoading,
  onNext,
  onSkip,
  onCancel,
}: Readonly<{
  locale: Locale;
  busy: boolean;
  selectedTitle?: string;
  onImport: (definition: FormDefinition) => void;
  onLoading: (loading: boolean) => void;
  onNext: () => void;
  onSkip: () => void;
  onCancel: () => void;
}>) => {
  const t = formCopy(locale);
  return (
    <fieldset disabled={busy} className="ui-form-stack border-0 p-0">
      <h2 className="text-lg">{t.importStep}</h2>
      <p>{t.importStepHint}</p>
      <FormJsonUpload
        locale={locale}
        onImport={onImport}
        onLoading={onLoading}
      />
      {selectedTitle && (
        <p role="status">
          {t.selectedForm}: {selectedTitle}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={!selectedTitle} onClick={onNext}>
          {t.nextStep}
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          {t.skipImport}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </fieldset>
  );
};
