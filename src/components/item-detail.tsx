"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { CategoryArtwork, CategoryIcon } from "@/components/category-icon";
import { ItemStatusBadge } from "@/components/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPill } from "@/components/ui/trust-pill";
import { useAuth } from "@/lib/auth";
import {
  deleteItem,
  getItem,
  listMyLoans,
  requestLoan,
  updateItem,
} from "@/lib/client-data";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  LOAN_STATUS_LABELS,
} from "@/lib/constants";
import type { Item, Loan } from "@/lib/types";
import {
  addDays,
  toDateInput,
} from "@/lib/utils";
import { trustChangeForReturn as trustForReturn } from "@/lib/trust";

export function ItemDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [dueDate, setDueDate] = useState(toDateInput(addDays(new Date(), 3)));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [managing, setManaging] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getItem(id), listMyLoans(user.$id)])
      .then(([nextItem, nextLoans]) => {
        if (cancelled) return;
        setItem(nextItem);
        setLoans(nextLoans);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load that item.",
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

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="aspect-[4/3] rounded-[22px]" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <EmptyState
        title="That item isn't here."
        description="It may have been removed or paused by its owner."
        action={
          <Link
            href="/app"
            className={buttonStyles({ variant: "primary", size: "sm" })}
          >
            Back to the shelf
          </Link>
        }
      />
    );
  }

  const isOwner = item.owner_id === profile?.$id;
  const existingLoan = loans.find(
    (loan) =>
      loan.item_id === item.$id &&
      ["requested", "active", "overdue"].includes(loan.status),
  );
  const canRequest =
    !isOwner && item.status === "available" && !existingLoan;

  async function onRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;
    setSubmitting(true);
    try {
      const loan = await requestLoan({
        item_id: item.$id,
        due_at: dueDate,
        note: note.trim() || undefined,
      });
      toast.success("Request sent. The owner will see it in their alerts.");
      router.push(`/app/loans/${loan.$id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send the request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePause() {
    if (!item) return;
    setManaging(true);
    try {
      const next = await updateItem(item.$id, {
        status: item.status === "available" ? "unavailable" : "available",
      });
      setItem({ ...item, ...next });
      toast.success(
        next.status === "available"
          ? "Back on the shelf."
          : "Listing paused. It won't appear on the shelf.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the listing.",
      );
    } finally {
      setManaging(false);
    }
  }

  async function onDelete() {
    if (!item) return;
    const confirmed = window.confirm(
      "Remove this listing? Open loans stay in the audit trail.",
    );
    if (!confirmed) return;
    setManaging(true);
    try {
      await deleteItem(item.$id);
      toast.success("Listing removed.");
      router.push("/app");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove the listing.",
      );
      setManaging(false);
    }
  }

  const minDate = toDateInput(addDays(new Date(), 1));
  const maxDate = toDateInput(addDays(new Date(), 21));
  const trustPreview = trustForReturn(
    new Date(`${dueDate}T23:59:59`).toISOString(),
  );

  return (
    <div className="animate-rise">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to the shelf
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.03fr_0.97fr] lg:items-start">
        <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt={item.title}
                className="size-full object-cover"
              />
            ) : (
              <CategoryArtwork category={item.category} className="size-full" />
            )}
            <div className="absolute left-3 top-3">
              <ItemStatusBadge status={item.status} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <CategoryIcon category={item.category} className="size-3.5" />
              {CATEGORY_LABELS[item.category]}
            </span>
            <span className="text-[11px] text-muted">
              {CONDITION_LABELS[item.condition]}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            On the shelf
          </p>
          <h1 className="mt-2 text-balance text-3xl leading-[1.04] tracking-[-0.04em] sm:text-[42px]">
            {item.title}
          </h1>
          <p className="mt-4 whitespace-pre-line text-pretty text-[15px] leading-7 text-muted">
            {item.description}
          </p>

          <div className="mt-6 rounded-[18px] border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={item.owner?.display_name ?? "Neighbor"}
                  id={item.owner_id}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    {isOwner ? "You" : item.owner?.display_name ?? "A neighbor"}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {item.owner?.completed_loans ?? 0} completed loans ·{" "}
                    {item.owner?.locality === "sunshine-apartments"
                      ? "Sunshine Apartments"
                      : "In the building"}
                  </p>
                </div>
              </div>
              {item.owner ? <TrustPill score={item.owner.trust_score} showLabel /> : null}
            </div>
            {item.owner?.bio ? (
              <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-muted">
                {item.owner.bio}
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {existingLoan ? (
              <Link
                href={`/app/loans/${existingLoan.$id}`}
                className="flex items-center justify-between gap-3 rounded-[16px] border border-line bg-accent-soft/50 p-4 transition-colors hover:border-accent/30"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-surface text-accent-strong">
                    <MessageCircle className="size-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium">
                      {LOAN_STATUS_LABELS[existingLoan.status]}
                    </p>
                    <p className="text-[11px] text-muted">
                      Open the loan to see details.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-accent-strong">Open</span>
              </Link>
            ) : null}

            {isOwner ? (
              <div className="rounded-[16px] border border-line bg-surface p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Owner controls
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={togglePause}
                    disabled={managing || item.status === "requested" || item.status === "on_loan"}
                  >
                    {item.status === "available" ? (
                      <Pause className="size-3.5" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    {item.status === "available" ? "Pause listing" : "Publish listing"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={managing}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
                {item.status === "on_loan" || item.status === "requested" ? (
                  <p className="mt-3 text-[10px] leading-5 text-muted">
                    This item has an open loan, so it can&apos;t be paused until
                    it comes back.
                  </p>
                ) : null}
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                disabled={!canRequest}
                onClick={() => setModalOpen(true)}
              >
                <CalendarDays className="size-4" />
                {item.status === "available"
                  ? "Request this item"
                  : item.status === "requested"
                    ? "Someone just requested it"
                    : item.status === "on_loan"
                      ? "Currently on loan"
                      : "Paused by the owner"}
              </Button>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-2/60 p-3">
                <ShieldCheck className="size-3.5 text-positive" />
                <p className="mt-2 text-[10px] leading-4 text-muted">
                  Contact unlocks after approval.
                </p>
              </div>
              <div className="rounded-xl bg-surface-2/60 p-3">
                <Clock3 className="size-3.5 text-accent" />
                <p className="mt-2 text-[10px] leading-4 text-muted">
                  Every loan has a return date.
                </p>
              </div>
              <div className="rounded-xl bg-surface-2/60 p-3">
                <User className="size-3.5 text-muted" />
                <p className="mt-2 text-[10px] leading-4 text-muted">
                  Only neighbors in this building.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Request ${item.title}`}
        description={`${item.owner?.display_name ?? "The owner"} will see your note and return date. Contact details unlock only if they approve.`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] leading-4 text-muted">
              On-time return: <span className="text-positive">+5 trust</span>
              <br />
              Late: <span className="text-danger">−2 per day</span>, max −10
            </p>
            <Button
              onClick={onRequest}
              disabled={submitting}
              size="md"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Send request
            </Button>
          </div>
        }
      >
        <form onSubmit={onRequest} className="space-y-4">
          <Field
            label="When will you return it?"
            hint={`${trustPreview > 0 ? "+5" : trustPreview} trust if returned by then`}
            htmlFor="due_date"
          >
            <Input
              id="due_date"
              type="date"
              min={minDate}
              max={maxDate}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </Field>
          <Field
            label="A note for the owner"
            hint="Optional"
            htmlFor="request_note"
          >
            <Textarea
              id="request_note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="I'm putting up two shelves on Saturday. Can return it the same evening."
              maxLength={280}
              className="min-h-24"
            />
          </Field>
          <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[11px] leading-5 text-muted">
            Your name and trust score are visible. Your email stays private
            until this request is approved.
          </p>
        </form>
      </Modal>
    </div>
  );
}
