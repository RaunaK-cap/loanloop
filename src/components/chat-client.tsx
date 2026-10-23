"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CategoryIcon } from "@/components/category-icon";
import { Avatar } from "@/components/ui/avatar";
import { TrustPill } from "@/components/ui/trust-pill";
import { useAuth } from "@/lib/auth";
import { askAssistant } from "@/lib/client-data";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { ChatItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  items?: ChatItem[];
};

const SUGGESTIONS = [
  "I need a drill for one afternoon",
  "Camping gear for a weekend in Coorg",
  "Something for a movie night",
  "A big pot for biryani",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatClient({ initialQuery = "" }: { initialQuery?: string }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Tell me what you need — a drill, a tent, a big pot. I'll only suggest things that are actually on the shelf in your building.",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  useEffect(() => {
    if (!initialQuery || initialSent.current) return;
    initialSent.current = true;
    void send(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function send(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || pending) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: newId(), role: "user", content: text },
    ]);
    setPending(true);

    try {
      const reply = await askAssistant(text);
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content: reply.answer,
          items: reply.items,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content:
            error instanceof Error
              ? `I couldn't reach the shelf just now. ${error.message}`
              : "I couldn't reach the shelf just now. Try again in a moment.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    void send();
  }

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Ask the shelf"
        title={
          <>
            What do you need for the{" "}
            <span className="font-display italic text-accent">weekend?</span>
          </>
        }
        description="Plain language is enough. The assistant searches real listings in Sunshine Apartments — it won't invent a neighbor or a thing."
      />

      <div className="overflow-hidden rounded-[22px] border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-[12px] font-medium">LoanLoop assistant</p>
              <p className="text-[10px] text-muted">
                Grounded in the building&apos;s shelf
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2.5 py-1 text-[10px] text-positive">
            <span className="size-1.5 rounded-full bg-positive" />
            Live
          </span>
        </div>

        <div className="flex min-h-[440px] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                {message.role === "assistant" ? (
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                    <Sparkles className="size-3.5" />
                  </span>
                ) : (
                  <Avatar
                    name={profile?.display_name ?? "You"}
                    id={profile?.$id}
                    size="sm"
                    className="mt-0.5"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[82%]",
                    message.role === "user" && "text-right",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-pretty text-[13px] leading-6",
                      message.role === "assistant"
                        ? "bg-surface-2/70 text-ink"
                        : "bg-ink text-paper",
                    )}
                  >
                    {message.content}
                  </div>
                  {message.items?.length ? (
                    <div className="mt-3 grid gap-2">
                      {message.items.map((item) => (
                        <Link
                          key={item.$id}
                          href={`/app/items/${item.$id}`}
                          className="group flex items-center gap-3 rounded-[14px] border border-line bg-surface p-2.5 text-left transition-colors hover:border-ink/20"
                        >
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="size-full object-cover"
                              />
                            ) : (
                              <span className="flex size-full items-center justify-center text-muted">
                                <CategoryIcon
                                  category={item.category}
                                  className="size-4"
                                />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium">
                              {item.title}
                            </p>
                            <p className="truncate text-[10px] text-muted">
                              {CATEGORY_LABELS[item.category]} ·{" "}
                              {item.owner_name}
                            </p>
                          </div>
                          <TrustPill score={item.owner_trust} />
                          <ArrowRight className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {pending ? (
              <div className="flex gap-3">
                <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl bg-surface-2/70 px-4 py-3.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-muted" />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {messages.length <= 2 ? (
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="shrink-0 rounded-full border border-line bg-paper px-3 py-1.5 text-[10px] text-muted transition-colors hover:border-ink/20 hover:text-ink"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="border-t border-line bg-paper/50 p-3 sm:p-4"
          >
            <div className="flex items-end gap-2 rounded-[16px] border border-line bg-surface p-1.5 focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/10">
              <MessageCircle className="mb-2.5 ml-1.5 size-4 shrink-0 text-muted" />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="A ladder for the ceiling lights…"
                maxLength={500}
                className="min-h-9 flex-1 bg-transparent py-1.5 text-[13px] text-ink placeholder:text-muted/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-strong disabled:opacity-40"
                aria-label="Send message"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] text-muted">
              Only recommends items currently listed by neighbors. No outside
              shopping links.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
