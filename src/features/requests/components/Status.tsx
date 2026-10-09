import type { Locale, Status as RequestStatus } from "../../../../shared/model";
import { copy } from "../../../i18n";
const tones: Record<RequestStatus, string> = {
  draft: "tw:bg-slate-100 tw:text-slate-600",
  submitted: "tw:bg-blue-50 tw:text-blue-800",
  in_review: "tw:bg-amber-50 tw:text-amber-800",
  rejected: "tw:bg-red-100 tw:text-red-800",
  approved: "tw:bg-green-100 tw:text-green-800",
};
export function Status({
  status,
  locale,
}: {
  status: RequestStatus;
  locale: Locale;
}) {
  return (
    <span
      className={`tw:inline-flex tw:w-fit tw:shrink-0 tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-semibold ${tones[status]}`}
    >
      <span aria-hidden="true" className="tw:text-[7px]">
        ●
      </span>
      {copy(locale)[status]}
    </span>
  );
}
