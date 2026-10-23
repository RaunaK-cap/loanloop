"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const { user, profile, loading, demoMode, signUp, demoLogin, authError } =
    useAuth();
  const [name, setName] = useState("");
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

    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp(name, email, password);
      toast.success("Your building access is ready.");
      router.replace(demoMode ? "/app" : "/onboarding");
    } catch (err) {
      const message =
        authError ??
        (err instanceof Error ? err.message : "Could not create your account.");
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
          Already have access?{" "}
          <Link
            href="/login"
            className="font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="animate-rise">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          Join the building
        </p>
        <h1 className="mt-3 text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-[44px]">
          Make the building a little{" "}
          <span className="font-display italic text-accent">more useful.</span>
        </h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted">
          One account, one building, one shelf. List what you have and borrow
          what you need — no fees, no strangers, no another-thing-to-buy.
        </p>

        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <Field label="Your name" htmlFor="name">
            <Input
              id="name"
              autoComplete="name"
              placeholder="Aisha Rao"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
            />
          </Field>
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
          <Field
            label="Password"
            hint="At least 8 characters"
            htmlFor="password"
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
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
            {demoMode ? "Create demo account" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            or
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button
          variant="secondary"
          className="mt-4 w-full"
          size="lg"
          onClick={onDemo}
          disabled={submitting}
        >
          Enter the demo shelf
          <ArrowRight className="size-4" />
        </Button>

        <p className="mt-4 text-center text-[11px] leading-5 text-muted">
          {demoMode
            ? "Demo data is stored in this browser only."
            : "By joining, you agree to keep the shelf kind and return things on time."}
        </p>
      </div>
    </AuthFrame>
  );
}
