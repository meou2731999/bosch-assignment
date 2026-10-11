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
    <aside className="min-w-0 pt-1" aria-label={t.requests}>
      <div className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted">
        WORKSPACE
      </div>
      <div className="mb-3 flex items-baseline justify-between [&_h2]:text-base [&_h2]:font-semibold [&_span]:rounded-full [&_span]:border [&_span]:border-line [&_span]:px-2 [&_span]:text-xs">
        <h2>{seesAll ? t.allRequests : t.requests}</h2>
        <span>{requests.length}</span>
      </div>
      {canCreate && (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 bg-brand text-white hover:bg-brand-hover mb-5 w-full justify-start"
          disabled={loading || busy}
          onClick={() => navigate()}
        >
          <span aria-hidden="true">＋</span> {t.newRequest}
        </button>
      )}
      <nav
        className="flex gap-2 overflow-x-auto pb-2 md:flex-col"
        aria-label={t.requests}
      >
        {!loading && !requests.length && (
          <p className="text-sm leading-relaxed text-muted">{t.empty}</p>
        )}
        {requests.map((r) => (
          <button
            key={r.id}
            className={`flex min-w-[210px] flex-col gap-2 rounded-lg border p-4 text-left disabled:opacity-50 md:min-w-0 [&_strong]:text-sm [&_strong]:font-semibold [&_small]:text-xs [&_small]:text-muted ${r.id === selectedId ? "border-green-300 bg-white shadow-sm" : "border-transparent bg-sage/40 hover:bg-sage"}`}
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
      <div className="mt-7 hidden border-t border-line pt-5 text-xs leading-relaxed text-muted md:block [&_span]:mb-2 [&_span]:block [&_span]:text-xl">
        <span aria-hidden="true">↳</span> {seesAll ? t.selectHint : t.help}
      </div>
    </aside>
  );
}
