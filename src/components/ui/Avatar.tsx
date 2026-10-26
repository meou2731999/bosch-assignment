export const Avatar = ({ name }: Readonly<{ name: string }>) => {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage text-brand">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
};
