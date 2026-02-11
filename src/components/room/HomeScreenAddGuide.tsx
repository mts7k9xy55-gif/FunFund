"use client";

import { useMemo, useState } from "react";

interface HomeScreenAddGuideProps {
  targetPath?: string;
}

export default function HomeScreenAddGuide({ targetPath = "/room" }: HomeScreenAddGuideProps) {
  const [message, setMessage] = useState<string | null>(null);

  const targetUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return targetPath;
    }
    return `${window.location.origin}${targetPath}`;
  }, [targetPath]);

  const handleCopy = async () => {
    if (!navigator?.clipboard) {
      setMessage("このブラウザではコピーできません");
      return;
    }

    try {
      await navigator.clipboard.writeText(targetUrl);
      setMessage("リンクをコピーしました");
    } catch {
      setMessage("リンクのコピーに失敗しました");
    }
  };

  return (
    <details className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700">
      <summary className="cursor-pointer font-semibold">ホーム画面に追加</summary>
      <div className="mt-2 space-y-1 leading-5">
        <p>iPhone: Safari共有 → 「ホーム画面に追加」</p>
        <p>Android: Chromeメニュー → 「ホーム画面に追加」</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-1 rounded border border-slate-300 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          ルームURLをコピー
        </button>
        {message ? <p className="text-slate-500">{message}</p> : null}
      </div>
    </details>
  );
}
