"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HeartHandshake, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { LoanCard } from "@/components/loan-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonStyles } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { listMyLoans } from "@/lib/client-data";
import type { Loan } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "borrowing" | "lending";

export default function LoansPage() {
  const { user, profile } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("borrowing");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    listMyLoans(user.$id)
      .then((next) => {
        if (!cancelled) setLoans(next);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load loans.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(
    () =>
      loans.filter((loan) =>
        tab === "borrowing"
          ? loan.borrower_id === profile?.$id
          : loan.owner_id === profile?.$id,
      ),
    [loans, tab, profile?.$id],
  );

  const open = filtered.filter((loan) =>
    ["requested", "active", "overdue"].includes(loan.status),
  );
  const history = filtered.filter((loan) =>
    ["returned", "declined", "cancelled"].includes(loan.status),
  );

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="The loop"
        title={
          <>
            Loans, in both{" "}
            <span className="font-display italic text-accent">directions.</span>
          </>
        }
        description="Borrowing and lending live in one quiet ledger. Every request has a return date, and every handover leaves a trail."
        action={
          <Link
            href="/app/items/new"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <Plus className="size-3.5" />
            List something
          </Link>
        }
      />

      <div className="mb-5 flex items-center gap-1.5 rounded-full border border-line bg-surface p-1 w-fit">
        {(["borrowing", "lending"] as Tab[]).map((entry) => {
          const count = loans.filter((loan) =>
            entry === "borrowing"
              ? loan.borrower_id === profile?.$id
              : loan.owner_id === profile?.$id,
          ).length;
          return (
            <button
              key={entry}
              type="button"
              onClick={() => setTab(entry)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] capitalize transition-colors",
                tab === entry
                  ? "bg-ink text-paper"
                  : "text-muted hover:text-ink",
              )}
            >
              {entry}
              <span
                className={cn(
                  "font-mono text-[10px]",
                  tab === entry ? "text-paper/50" : "text-muted",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[18px]" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.13em] text-muted">
                Open
              </h2>
              <span className="text-[11px] text-muted">
                {open.length} {open.length === 1 ? "loop" : "loops"}
              </span>
            </div>
            {open.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {open.map((loan) => (
                  <LoanCard
                    key={loan.$id}
                    loan={loan}
                    perspective={tab}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<HeartHandshake className="size-5" />}
                title={
                  tab === "borrowing"
                    ? "Nothing borrowed right now."
                    : "Nothing out on loan."
                }
                description={
                  tab === "borrowing"
                    ? "The shelf has a few things. Find one you need for a weekend."
                    : "When a neighbor requests something you've listed, it will appear here."
                }
                action={
                  tab === "borrowing" ? (
                    <Link
                      href="/app"
                      className={buttonStyles({ variant: "primary", size: "sm" })}
                    >
                      Browse the shelf
                    </Link>
                  ) : (
                    <Link
                      href="/app/items/new"
                      className={buttonStyles({ variant: "primary", size: "sm" })}
                    >
                      List something
                    </Link>
                  )
                }
              />
            )}
          </section>

          {history.length ? (
            <section>
              <h2 className="mb-3 text-[13px] font-medium uppercase tracking-[0.13em] text-muted">
                History
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {history.map((loan) => (
                  <LoanCard
                    key={loan.$id}
                    loan={loan}
                    perspective={tab}
                    className="opacity-80"
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-[16px] border border-line bg-surface/60 p-4 text-[11px] leading-5 text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-positive" />
        <p>
          Contact details are only visible to the two people on an active loan.
          Once an item is returned, the email thread closes with it.
        </p>
      </div>
    </div>
  );
}
