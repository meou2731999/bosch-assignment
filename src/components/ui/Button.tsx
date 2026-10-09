import type { ButtonHTMLAttributes } from "react";
const variants = {
  primary:
    "tw:border-transparent tw:bg-brand tw:text-white tw:hover:bg-brand-hover",
  secondary: "tw:border-slate-300 tw:bg-white tw:text-brand tw:hover:bg-sage",
  danger: "tw:border-red-300 tw:bg-white tw:text-red-800 tw:hover:bg-red-50",
};
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <button
      type={type}
      className={`tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-lg tw:border tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors tw:disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
