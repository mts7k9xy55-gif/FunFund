"use client";

import { ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  if (!user) {
    return <div>ログインしてください</div>;
  }

  return <>{children}</>;
}
