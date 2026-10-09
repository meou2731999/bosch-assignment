import type { Locale, RequestRecord } from "../../../../shared/model";
import { copy } from "../../../i18n";

export function Status({
  status,
  locale,
}: {
  status: RequestRecord["status"];
  locale: Locale;
}) {
  return (
    <span className={`status status-${status}`}>
      <span aria-hidden="true">●</span> {copy(locale)[status]}
    </span>
  );
}
