import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CategoryIcon } from "@/components/category-icon";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    number: "01",
    title: "List what you have",
    body: "A ladder, a tent, a projector, the good pressure cooker. Add a photo, a condition, and how long you're comfortable lending.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Ask the building",
    body: "Type what you need in plain language. LoanLoop searches the shelf and suggests real things owned by real neighbors.",
    icon: Users,
  },
  {
    number: "03",
    title: "Request, approve, return",
    body: "Every request has a return date. Approval unlocks contact details. Returning on time builds your trust score.",
    icon: Clock3,
  },
];

const PRINCIPLES = [
  {
    title: "Trust is earned in public",
    body: "Every profile carries a score built from completed loans and on-time returns. No anonymous strangers.",
    icon: ShieldCheck,
  },
  {
    title: "Contact stays private",
    body: "Neighbors never see each other's email until a loan is approved. The building, not the internet, is the context.",
    icon: LockKeyhole,
  },
  {
    title: "Every handover is on record",
    body: "Requested, approved, returned. A quiet audit trail lives under each loan, so nobody has to remember the details.",
    icon: Clock3,
  },
];

const SHELF = [
  { category: "tools", title: "6ft ladder", owner: "Aisha", trust: 72 },
  { category: "camping", title: "2-person tent", owner: "Maya", trust: 81 },
  { category: "kitchen", title: "Pressure cooker", owner: "Rohan", trust: 68 },
  { category: "electronics", title: "Mini projector", owner: "Dev", trust: 59 },
  { category: "sports", title: "Badminton set", owner: "Rohan", trust: 68 },
] as const;

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] text-muted md:flex">
          <a className="transition-colors hover:text-ink" href="#how">
            How it works
          </a>
          <a className="transition-colors hover:text-ink" href="#trust">
            Trust
          </a>
          <a className="transition-colors hover:text-ink" href="#principles">
            Principles
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/app"
            className={buttonStyles({
              variant: "primary",
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            Open the app
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pb-28 sm:pt-14">
        <div className="pointer-events-none absolute -right-32 -top-32 -z-10 size-[520px] rounded-full bg-[radial-gradient(circle,rgba(207,90,56,0.13),transparent_66%)]" />
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[11px] text-muted shadow-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
              </span>
              Now open in Sunshine Apartments
            </div>

            <h1 className="mt-6 max-w-[15ch] text-balance text-[52px] leading-[0.95] tracking-[-0.045em] sm:text-[70px] lg:text-[78px]">
              Your building
              <br />
              already owns
              <br />
              <span className="font-display italic tracking-[-0.025em] text-accent">
                what you need.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-pretty text-[15px] leading-7 text-muted sm:text-base">
              LoanLoop is a quiet lending shelf for your apartment. Borrow a
              drill, a tent, or the good pressure cooker from a neighbor —
              without buying another thing you&apos;ll use once.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className={buttonStyles({
                  variant: "primary",
                  size: "lg",
                  className: "group",
                })}
              >
                Enter Sunshine Apartments
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-positive" />
                No fees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-positive" />
                Verified building only
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-positive" />
                Contact stays private
              </span>
            </div>
          </div>

          <div className="animate-rise animate-rise-delay-2 relative mx-auto w-full max-w-[430px] lg:mr-0">
            <div className="absolute -left-5 top-16 z-20 hidden rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-soft sm:block">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-positive-soft text-positive">
                  <Check className="size-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium">Maya approved</p>
                  <p className="text-[10px] text-muted">Contact unlocked</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 bottom-16 z-20 rounded-2xl border border-line bg-surface px-3.5 py-2.5 shadow-soft sm:-right-5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <ShieldCheck className="size-3.5" />
                </span>
                <div>
                  <p className="text-[11px] font-medium">Trust +5</p>
                  <p className="text-[10px] text-muted">Returned on time</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[26px] border border-line bg-surface p-3 shadow-soft">
              <div className="relative overflow-hidden rounded-[18px] bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=85"
                  alt="A tent set up outdoors"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/50 to-transparent p-4 pt-14">
                  <div className="flex items-end justify-between gap-3 text-white">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">
                        Borrowed from Maya
                      </p>
                      <p className="mt-1 text-xl tracking-[-0.03em]">
                        2-person camping tent
                      </p>
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] backdrop-blur">
                      Due Friday
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-2 pb-1 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <MapPin className="size-3.5" />
                    Sunshine Apartments · Indiranagar
                  </div>
                  <Badge variant="positive">
                    <span className="size-1.5 rounded-full bg-positive" />
                    Live shelf
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-line bg-paper/60 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                      <CategoryIcon category="tools" className="size-3" />
                      Tools
                    </div>
                    <p className="mt-1.5 text-[12px] font-medium">
                      Cordless drill
                    </p>
                    <p className="text-[10px] text-muted">Rohan · 68 trust</p>
                  </div>
                  <div className="rounded-xl border border-line bg-paper/60 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                      <CategoryIcon category="kitchen" className="size-3" />
                      Kitchen
                    </div>
                    <p className="mt-1.5 text-[12px] font-medium">
                      Pressure cooker
                    </p>
                    <p className="text-[10px] text-muted">Aisha · 72 trust</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            In the building right now
          </p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {SHELF.map((item) => (
              <div
                key={item.title}
                className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-surface px-3 py-2 text-[12px]"
              >
                <CategoryIcon
                  category={item.category}
                  className="size-3.5 text-accent"
                />
                <span>{item.title}</span>
                <span className="text-muted">· {item.owner}</span>
                <span className="font-mono text-[10px] text-muted">
                  {item.trust}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-5xl">
            A shelf, a question,{" "}
            <span className="font-display italic text-accent">
              a handover.
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-7 text-muted">
            No marketplace. No delivery. Just the shortest possible path
            between someone who has a thing and someone who needs it for a
            weekend.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="group rounded-[18px] border border-line bg-surface p-6 transition-colors hover:border-ink/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-muted">
                    {step.number}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent-strong">
                    <Icon className="size-4" />
                  </span>
                </div>
                <h3 className="mt-10 text-lg tracking-[-0.025em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-pretty text-[13px] leading-6 text-muted">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="trust" className="bg-surface/60">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              The trust ledger
            </p>
            <h2 className="mt-3 max-w-md text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              A small score that keeps the shelf{" "}
              <span className="font-display italic text-accent">honest.</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-[15px] leading-7 text-muted">
              Everyone starts at 50. Returning on time adds five. Coming back
              late costs two a day, capped at ten. It is deliberately simple,
              visible, and impossible to buy.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Badge variant="positive">+5 on time</Badge>
              <Badge variant="danger">−2 per late day</Badge>
              <Badge variant="neutral">capped at −10</Badge>
              <Badge variant="outline">0–100</Badge>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(207,90,56,0.10),transparent_65%)]" />
            <div className="rounded-[24px] border border-line bg-surface p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                    AR
                  </span>
                  <div>
                    <p className="text-sm font-medium">Aisha Rao</p>
                    <p className="text-[11px] text-muted">
                      Sunshine Apartments · 14 loans
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                    Trust
                  </p>
                  <p className="font-display text-4xl leading-none text-ink">
                    72
                  </p>
                </div>
              </div>

              <div className="my-6 h-px bg-line" />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-positive-soft text-positive">
                      <Check className="size-3" />
                    </span>
                    <div>
                      <p className="font-medium">Cordless drill returned</p>
                      <p className="text-[10px] text-muted">
                        Rohan · 5 days ago
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-positive">
                    +5
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                      <Clock3 className="size-3" />
                    </span>
                    <div>
                      <p className="font-medium">Tent due Friday</p>
                      <p className="text-[10px] text-muted">
                        Maya · active loan
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-muted">3d</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[12px]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-surface-2 text-muted">
                      <Users className="size-3" />
                    </span>
                    <div>
                      <p className="font-medium">Rohan requested cooker</p>
                      <p className="text-[10px] text-muted">Needs approval</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-warning">
                    new
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="principles" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Built for the building
            </p>
            <h2 className="mt-3 text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Small social software,{" "}
              <span className="font-display italic text-accent">
                not another feed.
              </span>
            </h2>
            <p className="mt-4 max-w-sm text-pretty text-[15px] leading-7 text-muted">
              LoanLoop only knows one building at a time. That constraint is
              the product. It keeps the shelf useful and the trust real.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <div
                  key={principle.title}
                  className="rounded-[18px] border border-line bg-surface p-5"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-6 text-[15px] leading-5 tracking-[-0.02em]">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-5 text-muted">
                    {principle.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="relative overflow-hidden rounded-[26px] border border-line bg-ink px-6 py-12 text-paper sm:px-12 sm:py-16">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-paper/50">
                Sunshine Apartments
              </p>
              <h2 className="mt-3 max-w-xl text-balance text-4xl leading-[1.0] tracking-[-0.04em] sm:text-5xl">
                The next thing you need is probably{" "}
                <span className="font-display italic text-[#f0a183]">
                  two floors away.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-6 text-paper/60">
                Sign in with your building account, list one thing, and see
                what the shelf already has.
              </p>
            </div>
            <Link
              href="/app"
              className={buttonStyles({
                variant: "primary",
                size: "lg",
                className: "shrink-0",
              })}
            >
              Open the shelf
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Logo compact />
            <p className="text-[12px] text-muted">
              Borrow from your building.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted">
            <span>Built with Next.js + Appwrite</span>
            <span className="hidden size-1 rounded-full bg-line sm:block" />
            <span>Gemini-powered shelf search</span>
            <span className="hidden size-1 rounded-full bg-line sm:block" />
            <Link href="/login" className="transition-colors hover:text-ink">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
