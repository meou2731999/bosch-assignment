import { AppNavigation } from "./AppNavigation";
import { type Locale, type AccountUser } from "../../shared/model";
import { UserMenu } from "./UserMenu";
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
        <UserMenu
          user={user}
          locale={locale}
          setLocale={setLocale}
          disabled={busy || loading}
          onPassword={onPassword}
          onLogout={onLogout}
        />
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
