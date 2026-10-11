import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../../shared/model";
import { Button } from "./Button";

export function Modal({
  title,
  locale,
  busy,
  wide = false,
  onClose,
  children,
}: {
  title: string;
  locale: Locale;
  busy: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-modal="true"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            "button, input, select, textarea, a[href], [tabindex]",
          ),
        ].filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className={`tw:m-auto tw:max-h-[92dvh] tw:w-[94vw] tw:overflow-hidden tw:rounded-xl tw:border tw:border-line tw:bg-white tw:p-0 tw:font-sans tw:text-ink tw:shadow-xl tw:backdrop:bg-slate-950/50 ${wide ? "tw:max-w-5xl" : "tw:max-w-xl"}`}
    >
      <div className="tw:flex tw:max-h-[92dvh] tw:flex-col">
        <div className="tw:shrink-0 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:border-b tw:border-line tw:bg-white tw:p-5">
          <h2 id={titleId} className="tw:mb-0 tw:text-xl tw:font-semibold">
            {title}
          </h2>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {locale === "vi" ? "Đóng" : "Close"}
          </Button>
        </div>
        <div className="tw:min-h-0 tw:space-y-4 tw:overflow-y-auto tw:p-5 tw:md:p-6">
          {children}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
