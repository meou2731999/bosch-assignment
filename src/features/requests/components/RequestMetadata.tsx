import type { Locale, User, RequestRecord } from "../../../../shared/model";
import type { Definition } from "../api";
import { copy } from "../../../i18n";
import { formCopy } from "../../forms/copy";
export function RequestMetadata({
  locale,
  user,
  record,
  definition,
}: Readonly<{
  locale: Locale;
  user: User;
  record: RequestRecord | null;
  definition: Definition;
}>) {
  const t = copy(locale);
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line bg-stone-50 px-5 py-4 text-xs text-muted md:px-7 [&_strong]:ml-1 [&_strong]:font-semibold [&_strong]:text-ink">
      <span>
        {formCopy(locale).select} <strong>{definition.name}</strong>
      </span>
      <span>
        {t.version} <strong>{definition.version}</strong>
      </span>
      <span>
        {t.revision} <strong>{record?.revision ?? 0}</strong>
      </span>
      <span className="min-w-0 break-words md:ml-auto">
        {t.requestOwner}{" "}
        <strong>
          {record && record.ownerId !== user.id ? record.ownerId : user.name}
        </strong>
      </span>
    </div>
  );
}
