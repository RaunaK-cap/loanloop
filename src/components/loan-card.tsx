import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { CategoryArtwork } from "@/components/category-icon";
import { LoanStatusBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Loan } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";

export function LoanCard({
  loan,
  perspective,
  className,
}: {
  loan: Loan;
  perspective: "borrowing" | "lending";
  className?: string;
}) {
  const counterpart =
    perspective === "borrowing" ? loan.item?.owner : loan.borrower;
  const title = loan.item?.title ?? "Item";
  const overdue =
    (loan.status === "active" || loan.status === "overdue") &&
    isOverdue(loan.due_at);

  return (
    <Link
      href={`/app/loans/${loan.$id}`}
      className={cn(
        "group flex gap-3.5 rounded-[18px] border border-line bg-surface p-3.5 transition-[border-color,box-shadow] hover:border-ink/20 hover:shadow-soft",
        className,
      )}
    >
      <div className="relative size-[82px] shrink-0 overflow-hidden rounded-xl bg-surface-2">
        {loan.item?.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loan.item.image_url}
            alt={title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <CategoryArtwork
            category={loan.item?.category ?? "other"}
            className="size-full"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium tracking-[-0.015em]">
              {title}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {perspective === "borrowing" ? "From" : "To"}{" "}
              {counterpart?.display_name ?? "a neighbor"} ·{" "}
              {CATEGORY_LABELS[loan.item?.category ?? "other"]}
            </p>
          </div>
          <LoanStatusBadge status={loan.status} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar
              name={counterpart?.display_name ?? "Neighbor"}
              id={counterpart?.$id}
              size="xs"
            />
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px]",
                overdue ? "text-danger" : "text-muted",
              )}
            >
              <CalendarDays className="size-3" />
              {loan.status === "returned"
                ? `Returned ${formatDate(loan.returned_at)}`
                : loan.status === "requested"
                  ? `Due ${formatDate(loan.due_at)}`
                  : `Due ${formatDate(loan.due_at)}`}
            </span>
          </div>
          <ArrowUpRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
