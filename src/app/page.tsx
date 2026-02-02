"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ルートページはオープン一覧にリダイレクト
    router.replace("/public");
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-lg text-muted-fg">読み込み中...</div>
    </div>
  );
}
