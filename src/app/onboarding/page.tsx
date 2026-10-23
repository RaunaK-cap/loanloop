"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthFrame } from "@/components/auth-frame";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/client-data";
import { LOCALITIES } from "@/lib/constants";
import type { LocalityId } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refresh } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [locality, setLocality] = useState<LocalityId>("sunshine-apartments");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (profile) {
      router.replace("/app");
      return;
    }
    setDisplayName(user.name || "");
  }, [user, profile, loading, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateProfile({
        display_name: displayName,
        locality,
        bio: bio.trim() || undefined,
      });
      await refresh();
      toast.success("You're on the shelf.");
      router.replace("/app");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save your profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthFrame>
        <div className="text-center">
          <p className="text-sm text-muted">Sign in to finish your profile.</p>
          <Link href="/login" className="mt-4 inline-flex text-sm font-medium">
            Go to sign in <ArrowRight className="ml-1 size-4" />
          </Link>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <div className="animate-rise">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
          One last thing
        </p>
        <h1 className="mt-3 text-balance text-4xl leading-[1.02] tracking-[-0.04em] sm:text-[44px]">
          Which shelf are you{" "}
          <span className="font-display italic text-accent">joining?</span>
        </h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted">
          Your name and trust score are visible to neighbors. Your email stays
          private until a loan is approved.
        </p>

        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <Field label="Display name" htmlFor="display_name">
            <Input
              id="display_name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Aisha Rao"
              required
            />
          </Field>
          <Field label="Building" htmlFor="locality">
            <Select
              id="locality"
              value={locality}
              onChange={(event) =>
                setLocality(event.target.value as LocalityId)
              }
            >
              {LOCALITIES.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {entry.area}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="A line about you"
            hint="Optional"
            htmlFor="bio"
          >
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Plant parent, occasional baker, always happy to lend the good ladder."
              maxLength={280}
              className="min-h-24"
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
              <ShieldCheck className="size-4" />
            )}
            Enter the shelf
          </Button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <ShieldCheck className="size-3.5 text-positive" />
          Everyone starts at 50 trust. You earn the rest.
        </p>
      </div>
    </AuthFrame>
  );
}
