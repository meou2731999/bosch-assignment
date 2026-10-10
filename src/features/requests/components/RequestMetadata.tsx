import type { Locale, User, RequestRecord } from "../../../../shared/model";
import type { Definition } from "../api";
import { copy } from "../../../i18n";
import { formCopy } from "../../forms/copy";
export function RequestMetadata({
  locale,
  user,
  record,
  definition,
}: {
  locale: Locale;
  user: User;
  record: RequestRecord | null;
  definition: Definition;
}) {
  const t = copy(locale);
  return (
    <div className="tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:border-b tw:border-line tw:bg-stone-50 tw:px-5 tw:py-4 tw:text-xs tw:text-muted tw:md:px-7 tw:[&_strong]:ml-1 tw:[&_strong]:font-semibold tw:[&_strong]:text-ink">
      <span>
        {formCopy(locale).select} <strong>{definition.name}</strong>
      </span>
      <span>
        {t.version} <strong>{definition.version}</strong>
      </span>
      <span>
        {t.revision} <strong>{record?.revision ?? 0}</strong>
      </span>
      <span className="tw:md:ml-auto">
        {t.requestOwner}{" "}
        <strong>
          {record && record.ownerId !== user.id ? record.ownerId : user.name}
        </strong>
      </span>
    </div>
  );
}
