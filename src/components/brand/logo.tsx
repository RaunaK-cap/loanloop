import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-[10px] bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[18px]">
        <path
          d="M8.2 15.8a4.1 4.1 0 0 1 0-5.8l2.1-2.1a4.1 4.1 0 0 1 5.8 0"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M15.8 8.2a4.1 4.1 0 0 1 0 5.8l-2.1 2.1a4.1 4.1 0 0 1-5.8 0"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="1.15" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  compact = false,
  tone = "ink",
}: {
  className?: string;
  href?: string;
  compact?: boolean;
  tone?: "ink" | "paper";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 transition-opacity hover:opacity-80",
        tone === "ink" ? "text-ink" : "text-paper",
        className,
      )}
      aria-label="LoanLoop home"
    >
      <LogoMark />
      {!compact ? (
        <span className="text-[17px] font-semibold tracking-[-0.035em]">
          LoanLoop
        </span>
      ) : null}
    </Link>
  );
}
