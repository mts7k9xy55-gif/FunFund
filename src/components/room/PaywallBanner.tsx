// src/components/room/PaywallBanner.tsx
// Room有効化が必要な場合のバナー（Stripe Checkout導線）

"use client";

import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

interface PaywallBannerProps {
  roomStatus: "draft" | "active" | "past_due" | "canceled";
  roomId: Id<"rooms">;
  language: "ja" | "en";
}

export default function PaywallBanner({ roomStatus, roomId, language }: PaywallBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const messages: Record<"ja" | "en", Record<"draft" | "active" | "past_due" | "canceled", string>> = {
    ja: {
      draft: "このRoomは有効化が必要です",
      active: "", // activeの場合は表示しない
      past_due: "このRoomの有効期限が切れています",
      canceled: "このRoomはキャンセルされています",
    },
    en: {
      draft: "This room needs to be activated",
      active: "", // activeの場合は表示しない
      past_due: "This room's subscription has expired",
      canceled: "This room has been canceled",
    },
  };

  // activeの場合は表示しない
  if (roomStatus === "active") {
    return null;
  }

  const message = messages[language][roomStatus];

  return (
    <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{message}</span>
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              // Stripe Checkoutセッション作成APIを呼び出し
              const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || "Failed to create checkout session");
              }

              if (data.available === false) {
                throw new Error(
                  language === "ja"
                    ? "現在この環境では決済設定が未完了です"
                    : "Stripe checkout is not configured in this environment"
                );
              }

              // Checkout URLにリダイレクト
              if (data.url) {
                window.location.href = data.url;
                return;
              }

              throw new Error(
                language === "ja"
                  ? "決済URLの取得に失敗しました"
                  : "Failed to get checkout URL"
              );
            } catch (error: any) {
              alert(error.message || (language === "ja" ? "決済セッションの作成に失敗しました" : "Failed to create checkout session"));
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="ml-auto px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading
            ? (language === "ja" ? "処理中..." : "Loading...")
            : (language === "ja" ? "支払いへ" : "Go to Payment")}
        </button>
      </div>
    </div>
  );
}
