"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  Clock3,
  Copy,
  Loader2,
  Mail,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CategoryArtwork } from "@/components/category-icon";
import { LoanStatusBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPill } from "@/components/ui/trust-pill";
import { useAuth } from "@/lib/auth";
import {
  getLoan,
  listLoanEvents,
  loanAction,
  revealContact,
} from "@/lib/client-data";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  LOAN_EVENT_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/constants";
import type { Loan, LoanEvent } from "@/lib/types";
import { trustChangeForReturn } from "@/lib/trust";
import {
  cn,
  formatDate,
  formatDateTime,
  isOverdue,
} from "@/lib/utils";

export function LoanDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile, refresh } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [events, setEvents] = useState<LoanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [contact, setContact] = useState<{ name: string; email: string } | null>(
    null,
  );
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getLoan(id), listLoanEvents(id)])
      .then(([nextLoan, nextEvents]) => {
        if (cancelled) return;
        setLoan(nextLoan);
        setEvents(nextEvents);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load that loan.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const role = useMemo(() => {
    if (!loan || !profile) return null;
    if (loan.owner_id === profile.$id) return "owner";
    if (loan.borrower_id === profile.$id) return "borrower";
    return null;
  }, [loan, profile]);

  const counterpart =
    role === "owner" ? loan?.borrower ?? null : loan?.owner ?? null;

  async function reload() {
    const [nextLoan, nextEvents] = await Promise.all([
      getLoan(id),
      listLoanEvents(id),
    ]);
    setLoan(nextLoan);
    setEvents(nextEvents);
  }

  async function doAction(action: "approve" | "decline" | "cancel" | "return") {
    setActionLoading(action);
    try {
      await loanAction(id, action);
      await reload();
      await refresh();
      const messages = {
        approve: "Approved. Contact details are now visible to both of you.",
        decline: "Declined. The item is back on the shelf.",
        cancel: "Request cancelled. The item is back on the shelf.",
        return: "Returned. The trust ledger has been updated.",
      };
      toast.success(messages[action]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the loan.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function onReveal() {
    setContactLoading(true);
    try {
      const details = await revealContact(id);
      setContact(details);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not reveal contact.",
      );
    } finally {
      setContactLoading(false);
    }
  }

  async function copyEmail() {
    if (!contact) return;
    await navigator.clipboard.writeText(contact.email);
    toast.success("Email copied.");
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-40 rounded-[18px]" />
          <Skeleton className="h-40 rounded-[18px]" />
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <EmptyState
        title="That loan isn't here."
        description="It may have been removed, or this account doesn't have access."
        action={
          <Link href="/app/loans" className="text-sm font-medium text-accent">
            Back to loans
          </Link>
        }
      />
    );
  }

  const overdue =
    (loan.status === "active" || loan.status === "overdue") &&
    isOverdue(loan.due_at);
  const trustPreview = trustChangeForReturn(loan.due_at);

  return (
    <div className="animate-rise">
      <button
        type="button"
        onClick={() => router.push("/app/loans")}
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to loans
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            {role === "owner" ? "Lending" : "Borrowing"} ·{" "}
            {loan.status === "requested" ? "Request" : "Loan"}
          </p>
          <h1 className="mt-2 text-balance text-3xl leading-[1.04] tracking-[-0.04em] sm:text-[42px]">
            {loan.item?.title ?? "Item"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LoanStatusBadge status={loan.status} />
            <span className="text-[11px] text-muted">
              {LOAN_STATUS_LABELS[loan.status]}
            </span>
          </div>
        </div>
        {role === "owner" && loan.status === "requested" ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => doAction("decline")}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === "decline" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => doAction("approve")}
              disabled={Boolean(actionLoading)}
            >
              {actionLoading === "approve" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Approve
            </Button>
          </div>
        ) : null}
        {role === "borrower" && loan.status === "requested" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => doAction("cancel")}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === "cancel" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            Cancel request
          </Button>
        ) : null}
      </div>

      {loan.status === "active" || loan.status === "overdue" ? (
        <div className="mt-6 flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                overdue
                  ? "bg-danger-soft text-danger"
                  : "bg-positive-soft text-positive",
              )}
            >
              {overdue ? (
                <TriangleAlert className="size-4" />
              ) : (
                <Clock3 className="size-4" />
              )}
            </span>
            <div>
              <p className="text-[13px] font-medium">
                {overdue ? "This is overdue." : "Out on loan."}
              </p>
              <p className="mt-0.5 text-[11px] leading-5 text-muted">
                Due {formatDate(loan.due_at)}.{" "}
                {overdue
                  ? "Late returns cost 2 trust points per day, capped at 10."
                  : "Returning on time adds 5 trust points."}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => doAction("return")}
            disabled={Boolean(actionLoading)}
          >
            {actionLoading === "return" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CircleCheck className="size-3.5" />
            )}
            Mark as returned
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[18px] border border-line bg-surface p-4">
            <div className="flex gap-4">
              <Link
                href={`/app/items/${loan.item_id}`}
                className="relative size-[104px] shrink-0 overflow-hidden rounded-xl bg-surface-2"
              >
                {loan.item?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={loan.item.image_url}
                    alt={loan.item.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <CategoryArtwork
                    category={loan.item?.category ?? "other"}
                    className="size-full"
                  />
                )}
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/app/items/${loan.item_id}`}
                  className="truncate text-[14px] font-medium transition-colors hover:text-accent"
                >
                  {loan.item?.title ?? "Item"}
                </Link>
                <p className="mt-0.5 text-[11px] text-muted">
                  {CATEGORY_LABELS[loan.item?.category ?? "other"]} ·{" "}
                  {loan.item
                    ? CONDITION_LABELS[loan.item.condition] ?? loan.item.condition
                    : "Good"}
                </p>
                <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-muted">
                  {loan.item?.description}
                </p>
              </div>
            </div>

            {loan.request_note ? (
              <div className="mt-4 rounded-xl bg-surface-2/70 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Note from {role === "owner" ? "the borrower" : "you"}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-ink/80">
                  “{loan.request_note}”
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  Return by
                </p>
                <p className="mt-1 text-[12px] font-medium">
                  {formatDate(loan.due_at)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  {loan.status === "returned" ? "Returned" : "Requested"}
                </p>
                <p className="mt-1 text-[12px] font-medium">
                  {formatDateTime(
                    loan.status === "returned" ? loan.returned_at : loan.$createdAt,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={counterpart?.display_name ?? "Neighbor"}
                  id={counterpart?.$id}
                  size="md"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                    {role === "owner" ? "Borrower" : "Owner"}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium">
                    {counterpart?.display_name ?? "A neighbor"}
                  </p>
                  <p className="text-[10px] text-muted">
                    {counterpart?.completed_loans ?? 0} completed loans
                  </p>
                </div>
              </div>
              {counterpart ? <TrustPill score={counterpart.trust_score} /> : null}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              {loan.status === "active" || loan.status === "overdue" ? (
                contact ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-positive-soft/60 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-positive">
                        Contact unlocked
                      </p>
                      <a
                        href={`mailto:${contact.email}`}
                        className="mt-1 block truncate text-[12px] font-medium text-ink"
                      >
                        {contact.email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted transition-colors hover:text-ink"
                      aria-label="Copy email"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Mail className="size-3.5" />
                      Email unlocks for active loans.
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onReveal}
                      disabled={contactLoading}
                    >
                      {contactLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Mail className="size-3.5" />
                      )}
                      Reveal email
                    </Button>
                  </div>
                )
              ) : (
                <p className="flex items-center gap-2 text-[11px] leading-5 text-muted">
                  <ShieldCheck className="size-3.5 shrink-0 text-positive" />
                  {loan.status === "requested"
                    ? "Contact details unlock after the owner approves."
                    : "Contact details are closed once a loan ends."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium">Audit trail</h2>
            <span className="text-[10px] text-muted">
              {events.length} events
            </span>
          </div>
          <div className="mt-4 space-y-0">
            {events.map((event, index) => {
              const actor =
                event.actor_id === loan.owner_id
                  ? loan.owner?.display_name
                  : event.actor_id === loan.borrower_id
                    ? loan.borrower?.display_name
                    : "LoanLoop";
              return (
                <div key={event.$id} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < events.length - 1 ? (
                    <span className="absolute left-[9px] top-5 h-full w-px bg-line" />
                  ) : null}
                  <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line bg-surface">
                    <span className="size-1.5 rounded-full bg-accent" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium">
                      {LOAN_EVENT_LABELS[event.type] ?? event.type}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {actor} · {formatDateTime(event.$createdAt)}
                    </p>
                    {event.note ? (
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        {event.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl bg-surface-2/60 p-3.5">
            <p className="flex items-start gap-2 text-[10px] leading-4 text-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-positive" />
              {loan.status === "active" || loan.status === "overdue"
                ? `Return on time to change trust by ${trustPreview > 0 ? "+" : ""}${trustPreview}.`
                : "The trust ledger records the final return, not the conversation."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
