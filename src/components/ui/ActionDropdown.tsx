import { useEffect, useId, useRef, useState } from "react";

export type DropdownAction = Readonly<{
  label: string;
  onSelect: () => void;
  danger?: boolean;
}>;

export function ActionDropdown({
  label,
  context,
  disabled = false,
  actions,
}: Readonly<{
  label: string;
  context: string;
  disabled?: boolean;
  actions: readonly DropdownAction[];
}>) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function close(event: Event) {
      if (
        event.type === "scroll" &&
        panel.current?.contains(event.target as Node)
      )
        return;
      panel.current?.hidePopover();
    }
    window.addEventListener("resize", close);
    document.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) panel.current?.hidePopover();
  }, [disabled]);
  function position() {
    const button = trigger.current;
    const popup = panel.current;
    if (!button || !popup) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(240, window.innerWidth - 16);
    popup.style.width = `${width}px`;
    popup.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
    popup.style.maxHeight = "none";
    const height = popup.scrollHeight + 2;
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const upwards = below < height && above > below;
    popup.style.maxHeight = `${Math.max(0, upwards ? above : below) - 4}px`;
    popup.style.top = `${upwards ? Math.max(8, rect.top - Math.min(height, above - 4) - 4) : rect.bottom + 4}px`;
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        popoverTarget={id}
        disabled={disabled}
        aria-label={`${label}: ${context}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={position}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
      >
        {label} <span aria-hidden="true">⌄</span>
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="menu"
        tabIndex={-1}
        aria-label={`${label}: ${context}`}
        onToggle={(event) => {
          const expanded = event.newState === "open";
          setOpen(expanded);
          if (expanded) {
            position();
            panel.current
              ?.querySelector("button")
              ?.focus({ preventScroll: true });
          }
        }}
        onKeyDown={(event) => {
          const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
          if (!keys.includes(event.key)) return;
          event.preventDefault();
          const buttons = [...event.currentTarget.querySelectorAll("button")];
          const current = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          let index = event.key === "ArrowUp" ? current - 1 : current + 1;
          if (event.key === "Home") index = 0;
          if (event.key === "End") index = buttons.length - 1;
          buttons[(index + buttons.length) % buttons.length]?.focus();
        }}
        className="fixed inset-auto m-0 overflow-y-auto rounded-xl border border-line bg-white p-1.5 text-ink shadow-lg"
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              panel.current?.hidePopover();
              trigger.current?.focus({ preventScroll: true });
              action.onSelect();
            }}
            className={`block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-sage focus-visible:bg-sage focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50 ${action.danger ? "text-red-800" : "text-brand"}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </>
  );
}
