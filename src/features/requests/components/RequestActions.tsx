import type { Locale } from "../../../../shared/model";
import { copy } from "../../../i18n";
export function RequestActions({
  locale,
  saveStatus,
  ready,
  saving,
  uploading,
  save,
}: {
  locale: Locale;
  saveStatus: string;
  ready: boolean;
  saving: boolean;
  uploading: boolean;
  save: (action: "draft" | "submit") => Promise<void>;
}) {
  const t = copy(locale);
  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4 tw:border-t tw:border-line tw:px-5 tw:py-5 tw:md:px-7 tw:[&>div]:flex tw:[&>div]:flex-wrap tw:[&>div]:gap-2">
      <span className="tw:max-w-xs tw:text-xs tw:text-muted" role="status">
        {saveStatus}
      </span>
      <div>
        <button
          className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:border-slate-300 tw:bg-white tw:text-brand tw:hover:bg-sage"
          disabled={!ready || saving || uploading}
          onClick={() => void save("draft")}
        >
          {t.saveDraft}
        </button>
        <button
          className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:bg-brand tw:text-white tw:hover:bg-brand-hover"
          disabled={!ready || saving || uploading}
          onClick={() => void save("submit")}
        >
          {t.submit} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
