import { useState, type FormEvent } from "react";
import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { ErrorNotice } from "../../components/ui/ErrorNotice";
import { authApi } from "./api";
import { authCopy } from "./copy";
export { inputClass } from "../../components/ui/field";
import { inputClass } from "../../components/ui/field";
export const AuthScreen = ({
  locale,
  user,
  notice,
  onLogin,
  onChanged,
  onBack,
  embedded = false,
}: Readonly<{
  locale: Locale;
  user?: AccountUser;
  notice: string;
  onLogin: (user: AccountUser) => void;
  onChanged: () => void;
  onBack?: () => void;
  embedded?: boolean;
}>) => {
  const t = authCopy(locale);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    setBusy(true);
    try {
      if (user) {
        const password = String(data.get("password"));
        if (password !== data.get("confirm")) throw new Error(t.mismatch);
        await authApi.changePassword(String(data.get("current")), password);
        form.reset();
        onChanged();
      } else {
        const next = await authApi.login(
          String(data.get("email")),
          String(data.get("password")),
        );
        form.reset();
        onLogin(next);
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setBusy(false);
    }
  };
  const actionLabel = user ? t.changePassword : t.login;
  if (embedded && user) {
    return (
      <>
        <p>{t.passwordHint}</p>
        {notice && <p role="status">{notice}</p>}
        {error && <ErrorNotice error={error} locale={locale} />}
        <form onSubmit={(event) => void submit(event)}>
          <fieldset disabled={busy} className="ui-form-stack border-0 p-0">
            <label>
              {t.currentPassword}
              <input
                className={inputClass}
                name="current"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <label>
              {t.newPassword}
              <input
                className={inputClass}
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
              />
            </label>
            <label>
              {t.confirmPassword}
              <input
                className={inputClass}
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
              />
            </label>
            <Button type="submit">{busy ? t.working : actionLabel}</Button>
          </fieldset>
        </form>
      </>
    );
  }
  return (
    <main
      id="main"
      className="mx-auto my-12 max-w-md rounded-xl border border-line bg-white p-7 shadow-sm"
    >
      <h1 className="mb-4 text-2xl font-semibold">
        {user ? t.changePassword : t.login}
      </h1>
      {notice && <p role="status">{notice}</p>}
      {user && (
        <p>{user.mustChangePassword ? t.requiredChange : t.passwordHint}</p>
      )}
      {error && <ErrorNotice error={error} locale={locale} />}
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy} className="ui-form-stack border-0 p-0">
          {!user && (
            <label>
              {t.email}
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
          )}
          {user && (
            <label>
              {t.currentPassword}
              <input
                className={inputClass}
                name="current"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
          )}
          <label>
            {user ? t.newPassword : t.password}
            <input
              className={inputClass}
              name="password"
              type="password"
              required
              minLength={user ? 12 : undefined}
              maxLength={256}
              autoComplete={user ? "new-password" : "current-password"}
            />
          </label>
          {user && (
            <label>
              {t.confirmPassword}
              <input
                className={inputClass}
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
              />
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{busy ? t.working : actionLabel}</Button>
            {onBack && (
              <Button variant="secondary" onClick={onBack}>
                {t.back}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </main>
  );
};
