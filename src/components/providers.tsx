"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        theme="light"
        toastOptions={{
          style: {
            background: "#fffdf8",
            border: "1px solid #e2ddd2",
            color: "#171512",
            borderRadius: "14px",
            fontSize: "13px",
            boxShadow: "0 18px 50px -28px rgb(45 36 24 / 0.28)",
          },
        }}
      />
    </AuthProvider>
  );
}
