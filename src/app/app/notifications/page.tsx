"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { listNotifications, markNotificationRead } from "@/lib/client-data";
import type { Notification } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

function NoteIcon({ type }: { type: string }) {
  const Icon = type.includes("trust")
    ? ShieldCheck
    : type.includes("request")
      ? HeartHandshake
      : type.includes("overdue")
        ? Clock3
        : type.includes("approved")
          ? CheckCheck
          : Bell;
  return <Icon className="size-4" />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    listNotifications(user.$id)
      .then((next) => {
        if (!cancelled) setNotes(next);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Could not load alerts.",
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

  const unread = notes.filter((note) => !note.read).length;

  async function openNote(note: Notification) {
    if (!note.read) {
      setNotes((current) =>
        current.map((entry) =>
          entry.$id === note.$id ? { ...entry, read: true } : entry,
        ),
      );
      try {
        await markNotificationRead(note.$id);
      } catch {
        // Navigation is still useful if the write fails.
      }
    }
    if (note.link) router.push(note.link);
  }

  async function markAll() {
    setMarking(true);
    try {
      const unreadNotes = notes.filter((note) => !note.read);
      await Promise.all(
        unreadNotes.map((note) => markNotificationRead(note.$id)),
      );
      setNotes((current) =>
        current.map((entry) => ({ ...entry, read: true })),
      );
      toast.success("All caught up.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not mark alerts read.",
      );
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Alerts"
        title={
          <>
            Quiet updates from{" "}
            <span className="font-display italic text-accent">the loop.</span>
          </>
        }
        description="Requests, approvals, returns, and trust changes. No noise from outside the building."
        action={
          unread > 0 ? (
            <button
              type="button"
              onClick={markAll}
              disabled={marking}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[12px] text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[18px]" />
          ))}
        </div>
      ) : notes.length ? (
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          {notes.map((note, index) => (
            <button
              key={note.$id}
              type="button"
              onClick={() => openNote(note)}
              className={cn(
                "flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2/50 sm:px-5",
                index < notes.length - 1 && "border-b border-line",
                !note.read && "bg-accent-soft/20",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                  note.read
                    ? "bg-surface-2 text-muted"
                    : "bg-accent-soft text-accent-strong",
                )}
              >
                <NoteIcon type={note.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium">
                    {note.title}
                  </span>
                  {!note.read ? (
                    <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                  ) : null}
                </span>
                <span className="mt-1 block text-pretty text-[11px] leading-5 text-muted">
                  {note.body}
                </span>
                <span className="mt-1.5 block text-[10px] text-muted/70">
                  {formatRelative(note.$createdAt)}
                </span>
              </span>
              <ChevronRight className="mt-1 size-3.5 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="size-5" />}
          title="No alerts yet."
          description="When someone requests your item or approves yours, the update will land here."
        />
      )}

      <div className="mt-6 flex items-start gap-2.5 rounded-[16px] border border-line bg-surface/60 p-4 text-[11px] leading-5 text-muted">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Alerts are stored in Appwrite and refresh whenever you open this
          page. No email or push notification is required for the demo.
        </p>
      </div>
    </div>
  );
}
