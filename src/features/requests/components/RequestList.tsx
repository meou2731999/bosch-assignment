import { hasFormPermission } from "../../../../shared/forms";
import type { Locale, RequestRecord, User } from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Status } from "./Status";
export function RequestList({
  user,
  canCreate,
  locale,
  requests,
  selectedId,
  busy,
  loading,
  navigate,
}: {
  user: User;
  canCreate: boolean;
  locale: Locale;
  requests: RequestRecord[];
  selectedId?: string;
  busy: boolean;
  loading: boolean;
  navigate: (id?: string) => void;
}) {
  const t = copy(locale);
  const seesAll =
    Boolean(user.isAdmin) ||
    Object.keys(user.formPermissions).some((formId) =>
      hasFormPermission(user, formId, "view"),
    );
  return (
    <aside className="tw:min-w-0 tw:pt-1" aria-label={t.requests}>
      <div className="tw:mb-3 tw:text-[10px] tw:font-bold tw:tracking-[0.16em] tw:text-muted">
        WORKSPACE
      </div>
      <div className="tw:mb-3 tw:flex tw:items-baseline tw:justify-between tw:[&_h2]:text-base tw:[&_h2]:font-semibold tw:[&_span]:rounded-full tw:[&_span]:border tw:[&_span]:border-line tw:[&_span]:px-2 tw:[&_span]:text-xs">
        <h2>{seesAll ? t.allRequests : t.requests}</h2>
        <span>{requests.length}</span>
      </div>
      {canCreate && (
        <button
          className="tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:border-transparent tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:cursor-wait tw:disabled:opacity-50 tw:bg-brand tw:text-white tw:hover:bg-brand-hover tw:mb-5 tw:w-full tw:justify-start"
          disabled={loading || busy}
          onClick={() => navigate()}
        >
          <span aria-hidden="true">＋</span> {t.newRequest}
        </button>
      )}
      <nav
        className="tw:flex tw:gap-2 tw:overflow-x-auto tw:pb-2 tw:md:flex-col"
        aria-label={t.requests}
      >
        {!loading && !requests.length && (
          <p className="tw:text-sm tw:leading-relaxed tw:text-muted">
            {t.empty}
          </p>
        )}
        {requests.map((r) => (
          <button
            key={r.id}
            className={`tw:flex tw:min-w-[210px] tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:p-4 tw:text-left tw:disabled:opacity-50 tw:md:min-w-0 tw:[&_strong]:text-sm tw:[&_strong]:font-semibold tw:[&_small]:text-xs tw:[&_small]:text-muted ${r.id === selectedId ? "tw:border-green-300 tw:bg-white tw:shadow-sm" : "tw:border-transparent tw:bg-sage/40 tw:hover:bg-sage"}`}
            aria-current={r.id === selectedId ? "page" : undefined}
            disabled={busy || loading}
            onClick={() => navigate(r.id)}
          >
            <Status status={r.status} locale={locale} />
            <strong>{String(r.data.requestTitle || t.untitled)}</strong>
            <small>
              {new Date(r.updatedAt).toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-GB",
              )}{" "}
              · v{r.formVersion}
            </small>
          </button>
        ))}
      </nav>
      <div className="tw:mt-7 tw:hidden tw:border-t tw:border-line tw:pt-5 tw:text-xs tw:leading-relaxed tw:text-muted tw:md:block tw:[&_span]:mb-2 tw:[&_span]:block tw:[&_span]:text-xl">
        <span aria-hidden="true">↳</span> {seesAll ? t.selectHint : t.help}
      </div>
    </aside>
  );
}
