"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LogOut,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { ItemCard } from "@/components/item-card";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { listMyItems } from "@/lib/client-data";
import { LOCALITY_LABELS } from "@/lib/constants";
import { trustLabel } from "@/lib/trust";
import type { Item } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, demoMode, signOut, resetDemo } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    listMyItems(user.$id)
      .then((next) => {
        if (!cancelled) setItems(next);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load your shelf.",
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

  async function onSignOut() {
    await signOut();
    router.replace("/");
  }

  function onResetDemo() {
    resetDemo();
    toast.success("Demo data reset.");
    router.replace("/login");
  }

  if (!profile || !user) return null;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = (profile.trust_score / 100) * circumference;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Profile"
        title={
          <>
            Your corner of{" "}
            <span className="font-display italic text-accent">the shelf.</span>
          </>
        }
        description="A small public identity: your name, your building, and the trust you've earned. Your email stays private."
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                name={profile.display_name}
                id={profile.$id}
                size="lg"
              />
              <div>
                <h2 className="text-xl tracking-[-0.03em]">
                  {profile.display_name}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
                  <MapPin className="size-3" />
                  {LOCALITY_LABELS[profile.locality] ?? profile.locality}
                </p>
                <p className="mt-1 text-[11px] text-muted">{user.email}</p>
              </div>
            </div>

            <div className="relative flex size-[104px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--surface-2)"
                  strokeWidth="7"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${progress} ${circumference}`}
                />
              </svg>
              <div className="text-center">
                <p className="font-display text-3xl leading-none">
                  {profile.trust_score}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted">
                  trust
                </p>
              </div>
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-5 border-t border-line pt-4 text-pretty text-[13px] leading-6 text-muted">
              {profile.bio}
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="font-display text-2xl leading-none">
                {profile.completed_loans}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-muted">
                completed loans
              </p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="font-display text-2xl leading-none">
                {items.length}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-muted">
                things listed
              </p>
            </div>
            <div className="rounded-xl bg-surface-2/60 p-3">
              <p className="font-display text-2xl leading-none">
                {profile.trust_score >= 70 ? "A" : profile.trust_score >= 50 ? "B" : "C"}
              </p>
              <p className="mt-1.5 text-[10px] leading-4 text-muted">
                {trustLabel(profile.trust_score)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={onSignOut}>
              <LogOut className="size-3.5" />
              Sign out
            </Button>
            {demoMode ? (
              <Button variant="ghost" size="sm" onClick={onResetDemo}>
                <RotateCcw className="size-3.5" />
                Reset demo data
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[22px] border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-positive" />
            <h2 className="text-[13px] font-medium">How trust works</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-4 text-[12px]">
              <div>
                <p className="font-medium">Return on time</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted">
                  A complete handover.
                </p>
              </div>
              <span className="rounded-full bg-positive-soft px-2.5 py-1 font-mono text-[10px] text-positive">
                +5
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 text-[12px]">
              <div>
                <p className="font-medium">Return late</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted">
                  Two points per started day.
                </p>
              </div>
              <span className="rounded-full bg-danger-soft px-2.5 py-1 font-mono text-[10px] text-danger">
                −2/day
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 text-[12px]">
              <div>
                <p className="font-medium">Late cap</p>
                <p className="mt-0.5 text-[10px] leading-4 text-muted">
                  One loan can&apos;t sink you forever.
                </p>
              </div>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] text-muted">
                max −10
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-accent-soft/40 p-3.5">
            <p className="flex items-start gap-2 text-[10px] leading-4 text-muted">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
              Everyone starts at 50. The score is a record of completed
              handovers, not a popularity contest.
            </p>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <UserRound className="size-3.5" />
              Contact details stay private until a loan is active.
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              My shelf
            </p>
            <h2 className="mt-1 text-xl tracking-[-0.03em]">
              Things you&apos;re lending
            </h2>
          </div>
          <Link
            href="/app/items/new"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <Plus className="size-3.5" />
            Add item
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-[18px]" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard
                key={item.$id}
                item={item}
                currentUserId={profile.$id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="Your shelf is empty."
            description="List the thing you'd happily lend to a neighbor. It doesn't need to be new — it just needs to be useful."
            action={
              <Link
                href="/app/items/new"
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                List your first thing
                <ArrowRight className="size-3.5" />
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
