import { useState } from "react";
import { uiCopy } from "../../../i18n/ui";
import { Button } from "../../../components/ui/Button";
import type { Locale, RequestRecord } from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Status } from "./Status";

export const RequestList = ({
  locale,
  requests,
  navigate,
  emptyMessage,
}: Readonly<{
  locale: Locale;
  emptyMessage?: string;
  requests: RequestRecord[];
  navigate: (id: string) => void;
}>) => {
  const t = copy(locale);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = requests.slice(start, start + pageSize);
  return (
    <section
      aria-label={t.requests}
      className="overflow-hidden rounded-xl border border-line bg-white"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t.allRequests}</caption>
          <thead className="border-b border-line bg-sage text-muted">
            <tr>
              <th scope="col" className="px-5 py-4">
                {t.requestTitle}
              </th>
              <th scope="col" className="px-5 py-4">
                {t.requestStatus}
              </th>
              <th scope="col" className="px-5 py-4">
                {t.version}
              </th>
              <th scope="col" className="px-5 py-4">
                {t.updated}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visible.map((request) => (
              <tr key={request.id} className="hover:bg-sage/40">
                <td className="min-w-52 px-5 py-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(request.id)}
                  >
                    {String(request.data.requestTitle || t.untitled)}
                  </Button>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <Status status={request.status} locale={locale} />
                </td>
                <td className="px-5 py-4">{request.formVersion}</td>
                <td className="whitespace-nowrap px-5 py-4">
                  {new Date(request.updatedAt).toLocaleDateString(
                    uiCopy(locale).dateLocale,
                  )}
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-muted">
                  {emptyMessage ?? t.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <nav
        aria-label={t.pagination}
        className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-4"
      >
        <span role="status" className="text-sm text-muted">
          {requests.length ? start + 1 : 0}–
          {Math.min(start + pageSize, requests.length)} / {requests.length}
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            {t.previousPage}
          </Button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t.nextPage}
          </Button>
        </div>
      </nav>
    </section>
  );
};
