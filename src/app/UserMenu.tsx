import { useEffect, useId, useRef, useState } from "react";
import type { AccountUser, Locale } from "../../shared/model";
import { authCopy } from "../features/auth/copy";
import { copy } from "../i18n";
import { inputClass } from "../components/ui/field";
import { Button } from "../components/ui/Button";
export function UserMenu({
  user,
  locale,
  disabled,
  setLocale,
  onPassword,
  onLogout,
}: {
  user: AccountUser;
  locale: Locale;
  disabled: boolean;
  setLocale: (locale: Locale) => void;
  onPassword: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const t = authCopy(locale);
  const label = locale === "vi" ? "Menu người dùng" : "User menu";
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  function choose(action: () => void) {
    setOpen(false);
    action();
  }
  return (
    <div ref={root} className="tw:relative tw:min-w-0">
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${user.name}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="tw:flex tw:max-w-full tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:border-line tw:bg-white tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:hover:bg-sage"
      >
        <span
          aria-hidden="true"
          className="tw:grid tw:h-8 tw:w-8 tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-sage tw:text-brand"
        >
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="tw:max-w-44 tw:truncate">{user.name}</span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          id={id}
          className="tw:absolute tw:left-0 tw:z-50 tw:mt-2 tw:w-60 tw:max-w-[calc(100vw-2.5rem)] tw:space-y-2 tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-3 tw:shadow-lg tw:md:right-0 tw:md:left-auto"
        >
          <p className="tw:mb-3 tw:truncate tw:border-b tw:border-line tw:pb-3 tw:text-xs tw:text-muted">
            {user.email}
          </p>
          <label className="tw:mb-3 tw:block tw:border-b tw:border-line tw:pb-3 tw:text-xs tw:text-muted">
            {copy(locale).language}
            <select
              className={inputClass}
              aria-label={copy(locale).language}
              value={locale}
              disabled={disabled}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </label>
          <Button
            className="tw:w-full tw:justify-start"
            variant="secondary"
            disabled={disabled}
            onClick={() => choose(onPassword)}
          >
            {t.changePassword}
          </Button>
          <Button
            className="tw:w-full tw:justify-start"
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
}
