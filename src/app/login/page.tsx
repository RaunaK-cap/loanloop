"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    demoMode,
    signIn,
    demoLogin,
    authError,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    router.replace(profile ? "/app" : "/onboarding");
  }, [user, profile, loading, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back.");
      router.replace("/app");
    } catch (err) {
      const message =
        authError ?? (err instanceof Error ? err.message : "Could not sign in.");
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDemo() {
    setSubmitting(true);
    try {
      await demoLogin();
      router.replace("/app");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame
      footer={
        <p className="text-center text-[13px] text-muted">
          New to the building?{" "}
          <Link
            href="/signup"
            className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <div className="animate-rise">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          Welcome back
        </p>
        <h1 className="mt-3 text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-[44px]">
          The shelf is{" "}
          <span className="font-display italic text-accent">inside.</span>
        </h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted">
          Sign in with the email you used for Sunshine Apartments. Borrow
          something useful, or see who needs what you already own.
        </p>

        {demoMode ? (
          <div className="mt-6 rounded-[16px] border border-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium">Demo mode</p>
                <p className="mt-1 text-[12px] leading-5 text-muted">
                  Appwrite isn&apos;t connected yet. Enter the seeded Sunshine
                  Apartments shelf as Aisha, or use any email below.
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={onDemo}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                  Enter as Aisha
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@sunshine.demo"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {error ? (
            <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[12px] leading-5 text-danger">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {demoMode ? "Continue in demo" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted">
          {demoMode
            ? "Demo data is stored in this browser only."
            : "Your email is only shared with a neighbor after a loan is approved."}
        </p>
      </div>
    </AuthFrame>
  );
}
