import type { ComponentPropsWithRef, ReactNode } from "react";

const variants = {
  primary: "border-transparent bg-brand text-white hover:bg-brand-hover",
  secondary: "border-slate-300 bg-white text-brand hover:bg-sage",
  danger: "border-red-300 bg-white text-red-800 hover:bg-red-50",
};
const sizes = {
  default: "px-4 py-2.5",
  compact: "whitespace-nowrap px-3 py-2",
};

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  align?: "center" | "start";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export const Button = ({
  variant = "primary",
  size = "default",
  fullWidth = false,
  align = "center",
  startIcon,
  endIcon,
  children,
  className = "",
  type = "button",
  ...props
}: Readonly<ButtonProps>) => {
  return (
    <button
      type={type}
      className={`inline-flex max-w-full items-center gap-2 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${align === "start" ? "justify-start" : "justify-center"} ${className}`}
      {...props}
    >
      {startIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {startIcon}
        </span>
      )}
      {children}
      {endIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {endIcon}
        </span>
      )}
    </button>
  );
};
