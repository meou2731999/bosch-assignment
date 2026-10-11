import { AppNavigation } from "./AppNavigation";
import { type Locale, type AccountUser } from "../../shared/model";
import { authCopy } from "../features/auth/copy";
import { Button } from "../components/ui/Button";
import { copy } from "../i18n";
export function AppHeader({
  user,
  locale,
  busy,
  loading,
  setLocale,
  onLogout,
  onManage,
  onForms,
  onPassword,
  onRequests,
  activeView = "requests",
}: {
  user: AccountUser;
  locale: Locale;
  busy: boolean;
  loading: boolean;
  setLocale: (locale: Locale) => void;
  onLogout: () => void;
  onManage: () => void;
  onForms: () => void;
  onPassword: () => void;
  onRequests?: () => void;
  activeView?: "requests" | "users" | "forms";
}) {
  const t = copy(locale);
  const a = authCopy(locale);
  return (
    <>
      <header className="tw:flex tw:flex-col tw:gap-5 tw:border-b tw:border-line tw:bg-white tw:px-5 tw:py-6 tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:px-[5vw]">
        <a
          className="tw:flex tw:items-center tw:gap-3 tw:text-xl tw:font-bold tw:tracking-tight tw:text-ink tw:no-underline tw:[&_small]:mt-1 tw:[&_small]:block tw:[&_small]:text-xs tw:[&_small]:font-normal tw:[&_small]:tracking-normal tw:[&_small]:text-muted"
          href="#main"
        >
          <span
            className="tw:grid tw:h-11 tw:w-10 tw:place-items-center tw:rounded-[11px_11px_2px_11px] tw:bg-brand tw:text-2xl tw:text-lime-200"
            aria-hidden="true"
          >
            R
          </span>
          <span>
            Request Desk<small>{t.tagline}</small>
          </span>
        </a>
        <div className="tw:flex tw:gap-4 tw:[&_label]:flex tw:[&_label]:min-w-0 tw:[&_label]:flex-col tw:[&_label]:gap-1 tw:[&_label]:text-xs tw:[&_label]:text-muted tw:[&_select]:max-w-full tw:[&_select]:rounded-lg tw:[&_select]:border tw:[&_select]:border-line tw:[&_select]:bg-white tw:[&_select]:p-2 tw:[&_select]:text-sm tw:[&_select]:text-ink">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <span className="tw:text-sm">{user.name}</span>
            <Button
              variant="secondary"
              disabled={busy || loading}
              onClick={onPassword}
            >
              {a.changePassword}
            </Button>
            <Button
              variant="secondary"
              disabled={busy || loading}
              onClick={onLogout}
            >
              {a.logout}
            </Button>
          </div>
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
      {user.isAdmin && (
        <AppNavigation
          locale={locale}
          activeView={activeView}
          disabled={busy || loading}
          onRequests={onRequests}
          onManage={onManage}
          onForms={onForms}
        />
      )}
    </>
  );
}
