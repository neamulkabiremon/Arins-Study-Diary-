"use client";

import type { ReactNode } from "react";
import { AuthGate } from "@/components/AuthGate";
import { DiaryProvider } from "@/lib/diary-store";

export function Providers({
  children,
  demoMode,
}: {
  children: ReactNode;
  demoMode: boolean;
}) {
  return (
    <AuthGate>
      <DiaryProvider demoMode={demoMode}>{children}</DiaryProvider>
    </AuthGate>
  );
}
