import { useEffect, useState } from "react";
import type { AccountUser, Locale } from "../../shared/model";
import { Workspace } from "./Workspace";
import { AppHeader } from "./AppHeader";
import { AuthScreen } from "../features/auth/AuthScreen";
import { authApi } from "../features/auth/api";
import { authCopy } from "../features/auth/copy";
import { UsersPanel } from "../features/admin/UsersPanel";
import { ErrorNotice } from "../components/ui/ErrorNotice";
import { Button } from "../components/ui/Button";
import { HttpError, setCsrfToken } from "../lib/http";
export function App() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"requests" | "users" | "password">(
    "requests",
  );
  const [notice, setNotice] = useState<"changed" | "expired" | "">("");
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const t = authCopy(locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    let live = true;
    authApi
      .session()
      .then((next) => {
        if (live) setUser(next);
      })
      .catch((error) => {
        if (
          live &&
          !(error instanceof HttpError && error.code === "UNAUTHENTICATED")
        )
          setError(error);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    function expired() {
      setUser(null);
      setView("requests");
      setNotice("expired");
    }
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await authApi.logout();
      setUser(null);
      setView("requests");
      setNotice("");
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  }
  function changed() {
    setCsrfToken("");
    setUser(null);
    setView("requests");
    setNotice("changed");
  }
  if (loading)
    return (
      <p role="status" className="tw:p-8">
        {t.working}
      </p>
    );
  const auth = !user || user.mustChangePassword || view === "password";
  let content;
  if (auth)
    content = (
      <>
        <div className="tw:flex tw:justify-end tw:gap-3 tw:p-5">
          <label>
            {locale === "vi" ? "Ngôn ngữ" : "Language"}
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </label>
          {user && (
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => void logout()}
            >
              {t.logout}
            </Button>
          )}
        </div>
        <AuthScreen
          key={`${user?.id ?? "login"}-${view}`}
          locale={locale}
          user={user ?? undefined}
          notice={notice ? t[notice] : ""}
          onLogin={(next) => {
            setUser(next);
            setError(null);
            setNotice("");
            setView(next.isAdmin ? "users" : "requests");
          }}
          onChanged={changed}
          onBack={
            user && !user.mustChangePassword
              ? () => setView("requests")
              : undefined
          }
        />
      </>
    );
  else if (view === "users" && user.isAdmin)
    content = (
      <>
        <AppHeader
          user={user}
          locale={locale}
          busy={busy}
          loading={false}
          setLocale={setLocale}
          onLogout={() => void logout()}
          onManage={() => setView("users")}
          onPassword={() => setView("password")}
        />
        <div className="tw:px-5 tw:pt-5">
          <Button variant="secondary" onClick={() => setView("requests")}>
            {t.workspace}
          </Button>
        </div>
        <UsersPanel
          locale={locale}
          userId={user.id}
          onSelfChanged={async () => {
            setUser(await authApi.session());
          }}
        />
      </>
    );
  else
    content = (
      <Workspace
        key={user.id}
        user={user}
        locale={locale}
        setLocale={setLocale}
        onLogout={() => void logout()}
        onManage={() => setView("users")}
        onPassword={() => setView("password")}
      />
    );
  return (
    <div className="tw:min-h-screen tw:bg-canvas tw:font-sans tw:text-ink">
      {error && (
        <div className="tw:p-5">
          <ErrorNotice error={error} locale={locale} />
        </div>
      )}
      {content}
    </div>
  );
}
