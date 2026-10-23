import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-muted/60 transition-colors focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3.5 text-sm text-ink transition-colors focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium tracking-[-0.01em] text-ink"
        >
          {label}
        </label>
        {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
