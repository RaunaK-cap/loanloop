import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] hover:bg-accent-strong active:translate-y-px",
  secondary:
    "border border-line bg-surface text-ink hover:border-ink/25 hover:bg-surface-2/60 active:translate-y-px",
  ghost:
    "text-muted hover:bg-surface-2/70 hover:text-ink active:translate-y-px",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:translate-y-px",
  soft:
    "bg-accent-soft text-accent-strong hover:bg-accent-soft/70 active:translate-y-px",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-full px-3.5 text-[13px]",
  md: "h-11 rounded-full px-5 text-sm",
  lg: "h-12 rounded-full px-6 text-[15px]",
  icon: "size-10 rounded-full",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 font-medium transition-[background-color,border-color,color,transform,opacity] duration-150 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
