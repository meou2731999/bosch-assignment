import type { AccountUser, Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { authCopy } from "../auth/copy";
import { adminApi } from "../auth/api";
import { inputClass } from "../auth/AuthScreen";
export function ResetPasswordPanel({
  resetting,
  locale,
  busy,
  act,
  onCancel,
}: {
  resetting: AccountUser;
  locale: Locale;
  busy: boolean;
  act: (
    operation: () => Promise<AccountUser>,
    message: string,
  ) => Promise<void>;
  onCancel: () => void;
}) {
  const t = authCopy(locale);
  return (
    <section
      aria-label={t.reset}
      className="tw:mt-6 tw:max-w-xl tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-6"
    >
      <h2>
        {t.reset}: {resetting.name}
      </h2>
      <p>{t.resetHint}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const password = String(
            new FormData(event.currentTarget).get("password"),
          );
          if (window.confirm(t.confirmReset))
            void act(() => adminApi.reset(resetting.id, password), t.resetDone);
        }}
      >
        <fieldset disabled={busy} className="tw:space-y-4 tw:border-0 tw:p-0">
          <label>
            {t.initialPassword}
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
          <div className="tw:flex tw:gap-3">
            <Button type="submit">{busy ? t.working : t.reset}</Button>
            <Button variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
