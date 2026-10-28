import { useState, type KeyboardEvent } from "react";
import { uiCopy } from "../../../i18n/ui";
import { Button } from "../../../components/ui/Button";
import {
  ActionDropdown,
  type DropdownAction,
} from "../../../components/ui/ActionDropdown";
import { hasFormPermission } from "../../../../shared/forms";
import type { Locale, RequestRecord, User } from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Status } from "./Status";
import { tableClass } from "../../../components/ui/field";
import { api } from "../api";

export const RequestList = ({
  locale,
  user,
  requests,
  navigate,
  onReviewed,
  onBusy,
  busy,
  emptyMessage,
}: Readonly<{
  locale: Locale;
  user: User;
  emptyMessage?: string;
  requests: RequestRecord[];
  navigate: (id: string) => void;
  onReviewed: (request: RequestRecord) => void;
  onBusy: (busy: boolean) => void;
  busy: boolean;
}>) => {
  const t = copy(locale);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(requests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = requests.slice(start, start + pageSize);
  const openRequest = (id: string) => navigate(id);
  const isReviewable = (request: RequestRecord) =>
    hasFormPermission(user, request.formId, "review") &&
    request.ownerId !== user.id &&
    ["submitted", "in_review"].includes(request.status);
  const reviewRequest = async (
    request: RequestRecord,
    decision: "approve" | "reject",
  ) => {
    let comment = "";
    if (decision === "reject") {
      comment = window.prompt(t.rejectReason)?.trim() ?? "";
      if (!comment) return;
      if (comment.length > 2000) {
        window.alert(t.commentLimit);
        return;
      }
    }
    onBusy(true);
    try {
      onReviewed(
        await api.review(user, request.id, {
          revision: request.revision,
          decision,
          comment,
        }),
      );
    } catch (error) {
      window.alert((error as Error).message);
    } finally {
      onBusy(false);
    }
  };
  const actionsFor = (request: RequestRecord): DropdownAction[] => [
    { label: t.viewDetails, onSelect: () => openRequest(request.id) },
    ...(isReviewable(request)
      ? [
          {
            label: t.approve,
            onSelect: () => void reviewRequest(request, "approve"),
          },
          {
            label: t.reject,
            danger: true,
            onSelect: () => void reviewRequest(request, "reject"),
          },
        ]
      : []),
  ];
  const handleRowKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    id: string,
  ) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRequest(id);
    }
  };
  return (
    <section
      aria-label={t.requests}
      className="overflow-hidden rounded-xl border border-line bg-white"
    >
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <caption className="sr-only">{t.allRequests}</caption>
          <thead className="border-b border-line bg-sage text-muted">
            <tr>
              <th scope="col">{t.requestTitle}</th>
              <th scope="col">{t.requestStatus}</th>
              <th scope="col">{t.version}</th>
              <th scope="col">{t.updated}</th>
              <th scope="col" className="text-right">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((request) => (
              <tr
                key={request.id}
                tabIndex={0}
                className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sage-700"
                onClick={() => openRequest(request.id)}
                onKeyDown={(event) => handleRowKeyDown(event, request.id)}
              >
                <td className="min-w-52 font-medium">
                  {String(request.data.requestTitle || t.untitled)}
                </td>
                <td className="whitespace-nowrap">
                  <Status status={request.status} locale={locale} />
                </td>
                <td>{request.formVersion}</td>
                <td className="whitespace-nowrap">
                  {new Date(request.updatedAt).toLocaleDateString(
                    uiCopy(locale).dateLocale,
                  )}
                </td>
                <td
                  className="text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ActionDropdown
                    label={t.actions}
                    context={String(request.data.requestTitle || t.untitled)}
                    disabled={busy}
                    actions={actionsFor(request)}
                  />
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-muted">
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
        <output className="text-sm text-muted">
          {requests.length ? start + 1 : 0}–
          {Math.min(start + pageSize, requests.length)} / {requests.length}
        </output>
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
