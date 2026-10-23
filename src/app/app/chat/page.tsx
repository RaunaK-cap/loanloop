import { ChatClient } from "@/components/chat-client";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  return <ChatClient initialQuery={query ?? ""} />;
}
