import type { Locale } from "../../shared/model";
import { authCopy } from "../features/auth/copy";
import { formCopy } from "../features/forms/copy";
import { Button } from "../components/ui/Button";
export function AppNavigation({
  locale,
  activeView,
  disabled,
  onRequests,
  onManage,
  onForms,
}: {
  locale: Locale;
  activeView: "requests" | "users" | "forms";
  disabled: boolean;
  onRequests?: () => void;
  onManage: () => void;
  onForms: () => void;
}) {
  const t = authCopy(locale);
  return (
    <nav
      aria-label={locale === "vi" ? "Điều hướng quản trị" : "Admin navigation"}
      className="tw:border-b tw:border-line tw:bg-white"
    >
      <div className="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-wrap tw:gap-3 tw:px-5 tw:py-3 tw:md:px-10">
        {[
          { key: "requests", label: t.workspace, action: onRequests },
          { key: "users", label: t.users, action: onManage },
          { key: "forms", label: formCopy(locale).manage, action: onForms },
        ].map((item) => (
          <Button
            key={item.key}
            variant={activeView === item.key ? "primary" : "secondary"}
            disabled={disabled}
            aria-current={activeView === item.key ? "page" : undefined}
            onClick={item.action}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </nav>
  );
}
