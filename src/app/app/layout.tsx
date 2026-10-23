import { AppShell } from "@/components/app-shell";

// This subtree is authenticated and client-rendered; it should block
// navigation until the session is known rather than prerender a static shell.
export const instant = false;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
