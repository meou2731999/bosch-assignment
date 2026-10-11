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
      <header className="flex flex-col gap-5 border-b border-line bg-white px-5 py-6 md:flex-row md:items-center md:justify-between md:px-[5vw]">
        <a
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-ink no-underline [&_small]:mt-1 [&_small]:block [&_small]:text-xs [&_small]:font-normal [&_small]:tracking-normal [&_small]:text-muted"
          href="#main"
        >
          <span
            className="grid h-11 w-10 place-items-center rounded-[11px_11px_2px_11px] bg-brand text-2xl text-lime-200"
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
