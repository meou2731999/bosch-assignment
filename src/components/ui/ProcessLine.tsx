const focusStep = (element: HTMLLIElement | null) => {
  element?.focus();
};
export const ProcessLine = ({
  steps,
  current,
  label,
}: Readonly<{
  steps: string[];
  current: number;
  label: string;
}>) => (
  <ol aria-label={label} className="mb-6 flex list-none p-0">
    {steps.map((step, index) => (
      <li
        key={step}
        tabIndex={index === current ? -1 : undefined}
        ref={index === current ? focusStep : undefined}
        aria-current={index === current ? "step" : undefined}
        className={`flex flex-1 items-center gap-3 border-b-2 pb-4 text-sm ${index <= current ? "border-brand font-semibold text-brand" : "border-line text-muted"}`}
      >
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${index <= current ? "bg-brand text-white" : "bg-sage text-muted"}`}
        >
          {index < current ? "✓" : index + 1}
        </span>
        {step}
      </li>
    ))}
  </ol>
);
