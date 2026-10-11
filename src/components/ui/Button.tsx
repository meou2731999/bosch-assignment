import type { ButtonHTMLAttributes } from "react";
const variants = {
  primary: "border-transparent bg-brand text-white hover:bg-brand-hover",
  secondary: "border-slate-300 bg-white text-brand hover:bg-sage",
  danger: "border-red-300 bg-white text-red-800 hover:bg-red-50",
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
