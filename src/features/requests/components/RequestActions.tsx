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
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-5 md:px-7 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-2">
      <span className="max-w-xs text-xs text-muted" role="status">
        {saveStatus}
      </span>
      <div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 border-slate-300 bg-white text-brand hover:bg-sage"
          disabled={!ready || saving || uploading}
          onClick={() => void save("draft")}
        >
          {t.saveDraft}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 bg-brand text-white hover:bg-brand-hover"
          disabled={!ready || saving || uploading}
          onClick={() => void save("submit")}
        >
          {t.submit} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
