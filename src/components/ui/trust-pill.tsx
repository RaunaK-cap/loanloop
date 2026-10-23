import { cn } from "@/lib/utils";
import { trustLabel } from "@/lib/trust";

export function TrustPill({
  score,
  className,
  showLabel = false,
}: {
  score: number;
  className?: string;
  showLabel?: boolean;
}) {
  const tone =
    score >= 70
      ? "bg-positive-soft text-positive"
      : score >= 50
        ? "bg-accent-soft text-accent-strong"
        : "bg-warning-soft text-warning";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone,
        className,
      )}
      title={trustLabel(score)}
    >
      <span className="font-mono text-[10px] tracking-tight">{score}</span>
      {showLabel ? <span>{trustLabel(score)}</span> : <span>trust</span>}
    </span>
  );
}
