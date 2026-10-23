import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";

export function AuthFrame({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-positive/15 blur-3xl" />
        <div className="relative">
          <Logo tone="paper" />
          <div className="mt-20 max-w-md">
            <p className="text-[11px] uppercase tracking-[0.2em] text-paper/45">
              Sunshine Apartments · Indiranagar
            </p>
            <h2 className="mt-4 text-balance text-[46px] leading-[0.98] tracking-[-0.045em]">
              The best things in a building are{" "}
              <span className="font-display italic text-[#f0a183]">
                already inside it.
              </span>
            </h2>
            <p className="mt-5 max-w-sm text-pretty text-[14px] leading-6 text-paper/55">
              A ladder. A tent. A projector. LoanLoop is a quiet shelf for the
              things neighbors already own, with a trust score that keeps every
              handover honest.
            </p>
          </div>
        </div>

        <div className="relative mt-16 max-w-sm rounded-[20px] border border-paper/10 bg-paper/[0.045] p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name="Aisha Rao" id="demo-aisha" size="md" />
              <div>
                <p className="text-sm font-medium">Aisha Rao</p>
                <p className="text-[11px] text-paper/45">14 loans · 72 trust</p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-positive/15 px-2 py-1 text-[10px] text-[#a8d9bf]">
              <ShieldCheck className="size-3" />
              Good standing
            </span>
          </div>
          <div className="mt-4 space-y-2.5 border-t border-paper/10 pt-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 text-paper/60">
                <span className="flex size-5 items-center justify-center rounded-full bg-positive/20 text-[#a8d9bf]">
                  <Check className="size-2.5" />
                </span>
                Cordless drill returned
              </span>
              <span className="font-mono text-[10px] text-[#a8d9bf]">+5</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-2 text-paper/60">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent/20 text-[#f0a183]">
                  <Check className="size-2.5" />
                </span>
                Tent due Friday
              </span>
              <span className="font-mono text-[10px] text-paper/40">3d</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-h-dvh flex-col">
        <header className="flex h-20 items-center justify-between px-5 sm:px-10 lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-10">
          <div className="w-full max-w-md">
            {children}
            {footer ? <div className="mt-7">{footer}</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AuthMiniMark() {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-muted">
      <LogoMark className="size-5 rounded-[7px]" />
      LoanLoop
    </span>
  );
}
