import type { Locale, RequestRecord, User } from "../../../../shared/model";
import { copy } from "../../../i18n";
import { Status } from "./Status";
export function RequestList({
  user,
  locale,
  requests,
  selectedId,
  busy,
  loading,
  navigate,
}: {
  user: User;
  locale: Locale;
  requests: RequestRecord[];
  selectedId?: string;
  busy: boolean;
  loading: boolean;
  navigate: (id?: string) => void;
}) {
  const t = copy(locale);
  return (
    <aside className="sidebar" aria-label={t.requests}>
      <div className="section-eyebrow">WORKSPACE</div>
      <div className="sidebar-title">
        <h2>{user.role === "reviewer" ? t.allRequests : t.requests}</h2>
        <span>{requests.length}</span>
      </div>
      {user.role === "requester" && (
        <button
          className="button button-primary new-button"
          disabled={loading || busy}
          onClick={() => navigate()}
        >
          <span aria-hidden="true">＋</span> {t.newRequest}
        </button>
      )}
      <nav className="request-list" aria-label={t.requests}>
        {!loading && !requests.length && <p className="muted">{t.empty}</p>}
        {requests.map((r) => (
          <button
            key={r.id}
            className={`request-item ${r.id === selectedId ? "selected" : ""}`}
            aria-current={r.id === selectedId ? "page" : undefined}
            disabled={busy || loading}
            onClick={() => navigate(r.id)}
          >
            <Status status={r.status} locale={locale} />
            <strong>{r.data.requestTitle || t.untitled}</strong>
            <small>
              {new Date(r.updatedAt).toLocaleDateString(
                locale === "vi" ? "vi-VN" : "en-GB",
              )}{" "}
              · v{r.formVersion}
            </small>
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span aria-hidden="true">↳</span>{" "}
        {user.role === "reviewer" ? t.reviewHint : t.help}
      </div>
    </aside>
  );
}
