import { uiCopy } from "../../../i18n/ui";
import { Button } from "../../../components/ui/Button";
import { SelectableCard } from "../../../components/ui/SelectableCard";
import { PlusIcon } from "../../../components/ui/icons";
import { hasFormPermission } from "../../../../shared/forms";
import type { Locale, RequestRecord, User } from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Status } from "./Status";
export const RequestList = ({
  user,
  canCreate,
  locale,
  requests,
  selectedId,
  busy,
  loading,
  navigate,
}: Readonly<{
  user: User;
  canCreate: boolean;
  locale: Locale;
  requests: RequestRecord[];
  selectedId?: string;
  busy: boolean;
  loading: boolean;
  navigate: (id?: string) => void;
}>) => {
  const t = copy(locale);
  const seesAll =
    Boolean(user.isAdmin) ||
    Object.keys(user.formPermissions).some((formId) =>
      hasFormPermission(user, formId, "view"),
    );
  return (
    <aside className="min-w-0 pt-1" aria-label={t.requests}>
      <div className="mb-3 text-[10px] font-bold tracking-[0.16em] text-muted">
        {uiCopy(locale).workspace}
      </div>
      <div className="mb-3 flex items-baseline justify-between [&_h2]:text-base [&_h2]:font-semibold [&_span]:rounded-full [&_span]:border [&_span]:border-line [&_span]:px-2 [&_span]:text-xs">
        <h2>{seesAll ? t.allRequests : t.requests}</h2>
        <span>{requests.length}</span>
      </div>
      {canCreate && (
        <Button
          startIcon={<PlusIcon />}
          fullWidth
          align="start"
          className="mb-5"
          disabled={loading || busy}
          onClick={() => navigate()}
        >
          {t.newRequest}
        </Button>
      )}
      <nav
        className="flex gap-2 overflow-x-auto pb-2 md:flex-col"
        aria-label={t.requests}
      >
        {!loading && !requests.length && (
          <p className="text-sm leading-relaxed text-muted">{t.empty}</p>
        )}
        {requests.map((r) => (
          <SelectableCard
            key={r.id}
            selected={r.id === selectedId}
            disabled={busy || loading}
            onClick={() => navigate(r.id)}
          >
            <Status status={r.status} locale={locale} />
            <strong>{String(r.data.requestTitle || t.untitled)}</strong>
            <small>
              {new Date(r.updatedAt).toLocaleDateString(
                uiCopy(locale).dateLocale,
              )}{" "}
              · {uiCopy(locale).versionPrefix}
              {r.formVersion}
            </small>
          </SelectableCard>
        ))}
      </nav>
      <div className="mt-7 hidden border-t border-line pt-5 text-xs leading-relaxed text-muted md:block [&_span]:mb-2 [&_span]:block [&_span]:text-xl">
        <span aria-hidden="true">↳</span> {seesAll ? t.selectHint : t.help}
      </div>
    </aside>
  );
};
