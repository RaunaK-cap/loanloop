import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "accent"
  | "positive"
  | "warning"
  | "danger"
  | "outline";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-2 text-muted",
  accent: "bg-accent-soft text-accent-strong",
  positive: "bg-positive-soft text-positive",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line bg-transparent text-muted",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium tracking-[0.01em]",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cn("size-1.5 rounded-full bg-current", className)} />;
}
