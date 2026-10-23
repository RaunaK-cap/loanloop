import { colorForId, initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  id,
  size = "md",
  className,
}: {
  name: string;
  id?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "size-6 text-[9px]",
    sm: "size-8 text-[10px]",
    md: "size-10 text-xs",
    lg: "size-14 text-sm",
  };
  const color = id ? colorForId(id) : "#D95D39";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: color }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
