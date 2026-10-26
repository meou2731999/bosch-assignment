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
}: Readonly<{
  user: AccountUser;
  locale: Locale;
  disabled: boolean;
  setLocale: (locale: Locale) => void;
  onPassword: () => void;
  onLogout: () => void;
}>) {
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
    <div ref={root} className="relative min-w-0">
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={`${label}: ${user.name}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="flex max-w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold hover:bg-sage"
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage text-brand"
        >
          {user.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-44 truncate">{user.name}</span>
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
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </label>
          <Button
            className="w-full justify-start"
            variant="secondary"
            disabled={disabled}
            onClick={() => choose(onPassword)}
          >
            {t.changePassword}
          </Button>
          <Button
            className="w-full justify-start"
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
