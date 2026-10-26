import type { ComponentPropsWithRef } from "react";

export const SelectableCard = ({
  selected = false,
  className = "",
  type = "button",
  ...props
}: Readonly<ComponentPropsWithRef<"button"> & { selected?: boolean }>) => {
  return (
    <button
      type={type}
      aria-current={selected ? "page" : undefined}
      className={`flex min-w-[210px] flex-col gap-2 rounded-lg border p-4 text-left disabled:opacity-50 md:min-w-0 [&_strong]:text-sm [&_strong]:font-semibold [&_small]:text-xs [&_small]:text-muted ${selected ? "border-green-300 bg-white shadow-sm" : "border-transparent bg-sage/40 hover:bg-sage"} ${className}`}
      {...props}
    />
  );
};
