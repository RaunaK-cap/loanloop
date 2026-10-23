import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse-soft rounded-xl bg-surface-2",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 sm:px-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}
