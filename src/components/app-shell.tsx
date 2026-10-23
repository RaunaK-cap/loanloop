"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  HeartHandshake,
  House,
  LogOut,
  MessageCircle,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrustPill } from "@/components/ui/trust-pill";
import { useAuth } from "@/lib/auth";
import { listNotifications } from "@/lib/client-data";
import { LOCALITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "The shelf", icon: House },
  { href: "/app/chat", label: "Ask the shelf", icon: MessageCircle },
  { href: "/app/loans", label: "Loans", icon: HeartHandshake },
  { href: "/app/notifications", label: "Alerts", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading, demoMode, signOut } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile) {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user || loading) return;
    let cancelled = false;
    listNotifications(user.$id)
      .then((notes) => {
        if (!cancelled) {
          setUnread(notes.filter((note) => !note.read).length);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, loading, pathname]);

  const building = useMemo(
    () => (profile ? LOCALITY_LABELS[profile.locality] ?? profile.locality : ""),
    [profile],
  );

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  async function onSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-paper/80 backdrop-blur lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Logo />
        </div>

        <div className="mx-3 rounded-[14px] border border-line bg-surface px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
            Your building
          </p>
          <p className="mt-1 truncate text-[13px] font-medium">{building}</p>
          <p className="mt-0.5 truncate text-[10px] text-muted">
            {profile.locality === "sunshine-apartments"
              ? "Indiranagar, Bengaluru"
              : "Bengaluru"}
          </p>
        </div>

        <nav className="mt-6 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] transition-colors",
                  active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-surface-2/70 hover:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    active ? "text-paper" : "text-muted group-hover:text-ink",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.href === "/app/notifications" && unread > 0 ? (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-medium",
                      active
                        ? "bg-paper/15 text-paper"
                        : "bg-accent text-white",
                    )}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 px-3">
          <Link
            href="/app/items/new"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" />
            List something
          </Link>
        </div>

        <div className="mt-auto p-3">
          {demoMode ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-accent-soft/70 px-3 py-2 text-[10px] text-accent-strong">
              <Sparkles className="size-3.5" />
              Demo shelf · local data
            </div>
          ) : null}
          <div className="rounded-[16px] border border-line bg-surface p-3">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={profile.display_name}
                id={profile.$id}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium">
                  {profile.display_name}
                </p>
                <p className="text-[10px] text-muted">
                  {profile.completed_loans} loans completed
                </p>
              </div>
              <TrustPill score={profile.trust_score} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
              <Link
                href="/app/profile"
                className="text-[10px] text-muted transition-colors hover:text-ink"
              >
                View profile
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-danger"
              >
                <LogOut className="size-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/85 px-5 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          {demoMode ? <Badge variant="accent">Demo</Badge> : null}
          <Link
            href="/app/notifications"
            className="relative flex size-9 items-center justify-center rounded-full border border-line bg-surface text-muted"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-accent" />
            ) : null}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-7 pb-28 sm:px-8 lg:py-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {NAV.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px]",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon className="size-[18px]" />
                <span>{item.label === "Ask the shelf" ? "Ask" : item.label}</span>
                {item.href === "/app/notifications" && unread > 0 ? (
                  <span className="absolute right-2 top-1 size-1.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
          <Link
            href="/app/items/new"
            className="flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] text-accent-strong"
          >
            <span className="flex size-[22px] items-center justify-center rounded-full bg-accent text-white">
              <Plus className="size-3.5" />
            </span>
            <span>List</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
