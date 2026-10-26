import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const ChevronDownIcon = (props: IconProps) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
};

export const PlusIcon = (props: IconProps) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
};

export const ArrowUpRightIcon = (props: IconProps) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M5 19 19 5M7 5h12v12" />
    </svg>
  );
};
