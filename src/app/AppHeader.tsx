import { USERS, type Locale, type User } from "../../shared/model";
import { copy } from "../i18n";
export function AppHeader({
  user,
  locale,
  busy,
  loading,
  setLocale,
  onUserChange,
}: {
  user: User;
  locale: Locale;
  busy: boolean;
  loading: boolean;
  setLocale: (locale: Locale) => void;
  onUserChange: (user: User) => void;
}) {
  const t = copy(locale);
  return (
    <header className="topbar">
      <a className="brand" href="#main">
        <span className="brand-mark" aria-hidden="true">
          R
        </span>
        <span>
          Request Desk<small>{t.tagline}</small>
        </span>
      </a>
      <div className="session-controls">
        <label>
          {t.identity}
          <select
            value={user.id}
            disabled={busy || loading}
            onChange={(e) => {
              onUserChange(USERS.find((u) => u.id === e.target.value)!);
            }}
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {t[u.role]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.language}
          <select
            value={locale}
            disabled={busy}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
      </div>
    </header>
  );
}
