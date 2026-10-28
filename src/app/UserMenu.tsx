import { uiCopy } from "../i18n/ui";
import { useEffect, useId, useRef, useState } from "react";
import type { AccountUser, Locale } from "../../shared/model";
import { authCopy } from "../features/auth/copy";
import { copy } from "../i18n";
import { inputClass } from "../components/ui/field";
import { Button } from "../components/ui/Button";
import { ChevronDownIcon } from "../components/ui/icons";
import { Avatar } from "../components/ui/Avatar";
export const UserMenu = ({
  user,
  locale,
  disabled,
  setLocale,
  onPassword,
  onLogout,
}: Readonly<{
  user: AccountUser;
  locale: Locale;
  disabled: boolean;
  setLocale: (locale: Locale) => void;
  onPassword: () => void;
  onLogout: () => void;
}>) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const t = authCopy(locale);
  const label = uiCopy(locale).userMenu;
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };
  return (
    <div ref={root} className="relative min-w-0">
      <Button
        ref={trigger}
        disabled={disabled}
        aria-label={`${label}: ${user.name}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        variant="secondary"
        size="compact"
        startIcon={<Avatar name={user.name} />}
        endIcon={<ChevronDownIcon />}
      >
        <span className="max-w-44 truncate">{user.name}</span>
      </Button>
      {open && (
        <div
          id={id}
          className="absolute left-0 z-50 mt-2 w-60 max-w-[calc(100vw-2.5rem)] space-y-2 rounded-xl border border-line bg-white p-3 shadow-lg md:right-0 md:left-auto"
        >
          <p className="mb-3 truncate border-b border-line pb-3 text-xs text-muted">
            {user.email}
          </p>
          <label className="mb-3 block border-b border-line pb-3 text-xs text-muted">
            {copy(locale).language}
            <select
              className={inputClass}
              aria-label={copy(locale).language}
              value={locale}
              disabled={disabled}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="en">{uiCopy(locale).english}</option>
              <option value="vi">{uiCopy(locale).vietnamese}</option>
            </select>
          </label>
          <Button
            fullWidth
            align="start"
            variant="secondary"
            disabled={disabled}
            onClick={() => choose(onPassword)}
          >
            {t.changePassword}
          </Button>
          <Button
            fullWidth
            align="start"
            variant="secondary"
            disabled={disabled}
            onClick={() => choose(onLogout)}
          >
            {t.logout}
          </Button>
        </div>
      )}
    </div>
  );
};
