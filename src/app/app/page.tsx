"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ItemCard } from "@/components/item-card";
import { LoanCard } from "@/components/loan-card";
import { PageHeader } from "@/components/page-header";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { listItems, listMyLoans } from "@/lib/client-data";
import type { CategoryId } from "@/lib/constants";
import type { Item, Loan } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ShelfPage() {
  const router = useRouter();
  const { user, profile, demoMode } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listItems(profile.locality),
      user ? listMyLoans(user.$id) : Promise.resolve([]),
    ])
      .then(([nextItems, nextLoans]) => {
        if (cancelled) return;
        setItems(nextItems);
        setLoans(nextLoans);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load the shelf.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  const activeLoans = useMemo(
    () =>
      loans.filter((loan) =>
        ["requested", "active", "overdue"].includes(loan.status),
      ),
    [loans],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => category === "all" || item.category === category,
      ),
    [items, category],
  );

  function ask(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/app/chat?q=${encodeURIComponent(trimmed)}` : "/app/chat");
  }

  if (!profile) return null;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow={`${formatDate(new Date())} · Sunshine Apartments`}
        title={
          <>
            {greeting()}, {profile.display_name.split(" ")[0]}.
          </>
        }
        description={
          demoMode
            ? "This is the seeded Sunshine Apartments shelf. Try a request, approve Rohan's cooker, or return the tent."
            : "The shelf is made of things your neighbors already own. Ask for what you need, or add something you're happy to lend."
        }
        action={
          <Link
            href="/app/items/new"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            <Plus className="size-4" />
            List something
          </Link>
        }
      />

      <section className="relative overflow-hidden rounded-[22px] border border-line bg-ink p-6 text-paper sm:p-8">
        <div className="absolute -right-16 -top-24 size-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-paper/10 bg-paper/[0.06] px-2.5 py-1 text-[10px] text-paper/65">
              <Sparkles className="size-3 text-[#f0a183]" />
              Ask in plain language
            </p>
            <h2 className="mt-4 max-w-xl text-balance text-3xl leading-[1.02] tracking-[-0.04em] sm:text-4xl">
              What does the building{" "}
              <span className="font-display italic text-[#f0a183]">
                already have?
              </span>
            </h2>
            <form onSubmit={ask} className="mt-5 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-paper/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="a drill for one afternoon…"
                  className="h-11 w-full rounded-full border border-paper/15 bg-paper/[0.07] pl-10 pr-4 text-[13px] text-paper placeholder:text-paper/35 focus:border-paper/30 focus:outline-none focus:ring-4 focus:ring-paper/10"
                />
              </div>
              <Button type="submit" size="md" className="shrink-0">
                Ask
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-paper/10 bg-paper/[0.05] p-3">
              <p className="font-display text-3xl leading-none">
                {items.length}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-paper/45">
                things on the shelf
              </p>
            </div>
            <div className="rounded-2xl border border-paper/10 bg-paper/[0.05] p-3">
              <p className="font-display text-3xl leading-none">
                {activeLoans.length}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-paper/45">
                open loops
              </p>
            </div>
            <div className="rounded-2xl border border-paper/10 bg-paper/[0.05] p-3">
              <p className="font-display text-3xl leading-none">
                {profile.trust_score}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-paper/45">
                your trust
              </p>
            </div>
          </div>
        </div>
      </section>

      {activeLoans.length > 0 ? (
        <section className="mt-9">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                Your loop
              </p>
              <h2 className="mt-1 text-xl tracking-[-0.03em]">
                Open handovers
              </h2>
            </div>
            <Link
              href="/app/loans"
              className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink"
            >
              All loans <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {activeLoans.slice(0, 2).map((loan) => (
              <LoanCard
                key={loan.$id}
                loan={loan}
                perspective={
                  loan.owner_id === profile.$id ? "lending" : "borrowing"
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              On the shelf
            </p>
            <h2 className="mt-1 text-xl tracking-[-0.03em]">
              Available in the building
            </h2>
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
                category === "all"
                  ? "bg-ink text-paper"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setCategory(entry.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
                  category === entry.id
                    ? "bg-ink text-paper"
                    : "border border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-[18px]" />
              ))}
            </div>
          ) : filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <ItemCard
                  key={item.$id}
                  item={item}
                  currentUserId={profile.$id}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Search className="size-5" />}
              title={
                category === "all"
                  ? "The shelf is waiting for its first thing."
                  : "Nothing in this category yet."
              }
              description={
                category === "all"
                  ? "List a ladder, a tent, a cookbook — anything a neighbor might need for a weekend."
                  : "Try another category, or be the first to add something here."
              }
              action={
                <Link
                  href="/app/items/new"
                  className={buttonStyles({ variant: "primary", size: "sm" })}
                >
                  <Plus className="size-3.5" />
                  List something
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="mt-9 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <ShieldCheck className="size-4 text-positive" />
          <p className="mt-3 text-[13px] font-medium">Trust before contact</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Emails unlock only after an owner approves a request.
          </p>
        </div>
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <CalendarDays className="size-4 text-accent" />
          <p className="mt-3 text-[13px] font-medium">A return date, always</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Every request carries a due date. Late returns cost trust, not money.
          </p>
        </div>
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <Sparkles className="size-4 text-accent" />
          <p className="mt-3 text-[13px] font-medium">Gemini, grounded</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            The assistant only recommends real items on this shelf.
          </p>
        </div>
      </section>
    </div>
  );
}
