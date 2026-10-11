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
    <details className="mx-1 mt-4 mb-7 text-xs text-muted [&_label]:block [&_label]:pt-3 [&_input]:mr-1 [&_input]:accent-brand">
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
