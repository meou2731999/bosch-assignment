import type { ComponentProps } from "react";
import type { Locale } from "../../../shared/model";
import { Button } from "../../components/ui/Button";
import { AuthScreen } from "../../features/auth/AuthScreen";
import { authCopy } from "../../features/auth/copy";
import { uiCopy } from "../../i18n/ui";

type AuthPageProps = ComponentProps<typeof AuthScreen> & {
  busy: boolean;
  setLocale: (locale: Locale) => void;
  onLogout: () => void;
  embedded?: boolean;
};

export const AuthPage = ({
  busy,
  setLocale,
  onLogout,
  embedded = false,
  ...authProps
}: AuthPageProps) => {
  const { locale, user } = authProps;
  const ui = uiCopy(locale);
  if (embedded) return <AuthScreen {...authProps} embedded />;
  return (
    <>
      <div className="flex flex-wrap items-end justify-end gap-3 p-5">
        <label>
          {ui.language}
          <select
            className="ui-field"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="en">{ui.english}</option>
            <option value="vi">{ui.vietnamese}</option>
          </select>
        </label>
        {user && (
          <Button disabled={busy} variant="secondary" onClick={onLogout}>
            {authCopy(locale).logout}
          </Button>
        )}
      </div>
      <AuthScreen {...authProps} />
    </>
  );
};
