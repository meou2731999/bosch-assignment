import type { ComponentPropsWithRef } from "react";

export const MenuItem = ({
  danger = false,
  className = "",
  type = "button",
  ...props
}: Readonly<ComponentPropsWithRef<"button"> & { danger?: boolean }>) => {
  return (
    <button
      type={type}
      role="menuitem"
      className={`block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-sage focus-visible:bg-sage focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50 ${danger ? "text-red-800" : "text-brand"} ${className}`}
      {...props}
    />
  );
};
