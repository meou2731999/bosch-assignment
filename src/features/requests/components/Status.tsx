import type { Locale, Status as RequestStatus } from "../../../../shared/model";
import { copy } from "../../../i18n";
const tones: Record<RequestStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-blue-50 text-blue-800",
  in_review: "bg-amber-50 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  approved: "bg-green-100 text-green-800",
};
export const Status = ({
  status,
  locale,
}: Readonly<{
  status: RequestStatus;
  locale: Locale;
}>) => {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[status]}`}
    >
      <span aria-hidden="true" className="text-[7px]">
        ●
      </span>
      {copy(locale)[status]}
    </span>
  );
};
