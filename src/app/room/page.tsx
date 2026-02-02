// src/app/room/page.tsx
// グループ（Room）側のページ

"use client";

import dynamic from "next/dynamic";
import { AuthGate } from "@/components/AuthGate";

const FunFundApp = dynamic(() => import("@/components/NewFunFundApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-lg text-muted-fg">読み込み中...</div>
    </div>
  ),
});

export default function RoomPage() {
  return (
    <AuthGate>
      <FunFundApp />
    </AuthGate>
  );
}
