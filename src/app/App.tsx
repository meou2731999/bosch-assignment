import { ErrorNotice } from "../components/ui/ErrorNotice";
import { authCopy } from "../features/auth/copy";
import { AuthPage } from "../pages/auth/AuthPage";
import { FormsPage } from "../pages/forms/FormsPage";
import { RequestsPage } from "../pages/requests/RequestsPage";
import { UsersPage } from "../pages/users/UsersPage";
import { useAppSession } from "./useAppSession";
import { Modal } from "../components/ui/Modal";

export const App = () => {
  const {
    user,
    locale,
    setLocale,
    loading,
    view,
    setView,
    notice,
    error,
    busy,
    logout,
    changed,
    login,
    refreshUser,
  } = useAppSession();
  const t = authCopy(locale);
  const onLogout = () => void logout();
  const onRequests = () => setView("requests");
  const onManage = () => setView("users");
  const onForms = () => setView("forms");
  const onPassword = () => setView("password");
  const closePassword = () => setView("requests");

  const renderPage = () => {
    if (!user || user.mustChangePassword)
      return (
        <AuthPage
          key={`${user?.id ?? "login"}`}
          locale={locale}
          setLocale={setLocale}
          user={user ?? undefined}
          busy={busy}
          notice={notice ? t[notice] : ""}
          onLogin={login}
          onChanged={changed}
          onLogout={onLogout}
        />
      );

    const pageProps = {
      user,
      locale,
      setLocale,
      busy,
      onLogout,
      onRequests,
      onManage,
      onForms,
      onPassword,
    };
    if (user.isAdmin && view === "users")
      return <UsersPage {...pageProps} onSelfChanged={refreshUser} />;
    if (user.isAdmin && view === "forms") return <FormsPage {...pageProps} />;
    return <RequestsPage key={user.id} {...pageProps} />;
  };

  if (loading) return <output className="p-8">{t.working}</output>;
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {error && (
        <div className="p-5">
          <ErrorNotice error={error} locale={locale} />
        </div>
      )}
      {renderPage()}
      {user && !user.mustChangePassword && view === "password" && (
        <Modal
          title={t.changePassword}
          locale={locale}
          busy={busy}
          onClose={closePassword}
        >
          <AuthPage
            locale={locale}
            setLocale={setLocale}
            user={user}
            busy={busy}
            notice={notice ? t[notice] : ""}
            onLogin={login}
            onChanged={changed}
            onLogout={onLogout}
            embedded
          />
        </Modal>
      )}
    </div>
  );
};
