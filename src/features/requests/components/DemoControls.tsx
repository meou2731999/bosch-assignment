import type { Locale } from "../../../../shared/model";
import { copy } from "../../../i18n";
export function DemoControls({
  locale,
  fail,
  saving,
  onChange,
}: {
  locale: Locale;
  fail: boolean;
  saving: boolean;
  onChange: (fail: boolean) => void;
}) {
  const t = copy(locale);
  return (
    <details className="tw:mx-1 tw:mt-4 tw:mb-7 tw:text-xs tw:text-muted tw:[&_label]:block tw:[&_label]:pt-3 tw:[&_input]:mr-1 tw:[&_input]:accent-brand">
      <summary>{t.demoTools}</summary>
      <label>
        <input
          type="checkbox"
          checked={fail}
          disabled={saving}
          onChange={(e) => onChange(e.target.checked)}
        />{" "}
        {t.fail}
      </label>
    </details>
  );
}
