"use client";

import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/language-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#1C1C1F",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#ECECEC",
            padding: "12px 16px",
            fontSize: "14px",
          },
        }}
      />
    </LanguageProvider>
  );
}
