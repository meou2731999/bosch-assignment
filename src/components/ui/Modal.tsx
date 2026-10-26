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
}: Readonly<{
  title: string;
  locale: Locale;
  busy: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}>) {
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
      className={`m-auto max-h-[92dvh] w-[94vw] overflow-hidden rounded-xl border border-line bg-white p-0 font-sans text-ink shadow-xl backdrop:bg-slate-950/50 ${wide ? "max-w-5xl" : "max-w-xl"}`}
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="shrink-0 flex items-center justify-between gap-4 border-b border-line bg-white p-5">
          <h2 id={titleId} className="mb-0 text-xl font-semibold">
            {title}
          </h2>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {locale === "vi" ? "Đóng" : "Close"}
          </Button>
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto p-5 md:p-6">
          {children}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
