import { Button } from "../../../components/ui/Button";
import { ArrowUpRightIcon } from "../../../components/ui/icons";
import type { Locale } from "../../../../shared/model";
import { copy } from "../../../i18n";
export const RequestActions = ({
  locale,
  saveStatus,
  ready,
  saving,
  uploading,
  save,
}: Readonly<{
  locale: Locale;
  saveStatus: string;
  ready: boolean;
  saving: boolean;
  uploading: boolean;
  save: (action: "draft" | "submit") => Promise<void>;
}>) => {
  const t = copy(locale);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-5 md:px-7 [&>div]:flex [&>div]:flex-wrap [&>div]:gap-2">
      <output className="max-w-xs text-xs text-muted">{saveStatus}</output>
      <div>
        <Button
          variant="secondary"
          disabled={!ready || saving || uploading}
          onClick={() => void save("draft")}
        >
          {t.saveDraft}
        </Button>
        <Button
          endIcon={<ArrowUpRightIcon />}
          disabled={!ready || saving || uploading}
          onClick={() => void save("submit")}
        >
          {t.submit}
        </Button>
      </div>
    </div>
  );
};
