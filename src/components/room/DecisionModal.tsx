// src/components/room/DecisionModal.tsx
// 判断モーダル: stance + reason必須

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: Id<"rooms">;
  threadId: Id<"threads">;
  language: "ja" | "en";
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function DecisionModal({
  isOpen,
  onClose,
  roomId,
  threadId,
  language,
  onError,
  onSuccess,
}: DecisionModalProps) {
  const [stance, setStance] = useState<"yes" | "no" | "hold">("yes");
  const [reasonBody, setReasonBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const decide = useMutation(api.decisions.decide);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reasonBody.trim()) {
      const msg = language === "ja" ? "理由を入力してください" : "Please enter a reason";
      onError?.(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await decide({
        roomId,
        threadId,
        stance,
        reasonBody: reasonBody.trim(),
      });

      const successMsg = language === "ja" ? "判断を下しました" : "Decision submitted";
      onSuccess?.(successMsg);
      setReasonBody("");
      setStance("yes");
      onClose();
    } catch (error: any) {
      // エラーメッセージを明確に表示
      let errorMsg = error.message || (language === "ja" ? "判断に失敗しました" : "Failed to submit decision");
      
      // エラーメッセージを日本語化
      if (error.message?.includes("not active")) {
        errorMsg = language === "ja" ? "このRoomは有効化が必要です" : "This room needs to be activated";
      } else if (error.message?.includes("Viewers cannot write")) {
        errorMsg = language === "ja" ? "viewerは書き込みできません" : "Viewers cannot write";
      } else if (error.message?.includes("requires a reason")) {
        errorMsg = language === "ja" ? "理由を入力してください" : "Please enter a reason";
      }

      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = {
    title: language === "ja" ? "判断を下す" : "Make Decision",
    stance: language === "ja" ? "立場" : "Stance",
    yes: language === "ja" ? "賛成" : "Yes",
    no: language === "ja" ? "反対" : "No",
    hold: language === "ja" ? "保留" : "Hold",
    reason: language === "ja" ? "理由（必須）" : "Reason (required)",
    reasonPlaceholder: language === "ja" ? "判断の理由を入力してください..." : "Enter your reason...",
    submit: language === "ja" ? "判断を下す" : "Submit Decision",
    cancel: language === "ja" ? "キャンセル" : "Cancel",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">{t.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Stance選択 */}
          <div>
            <label className="block text-sm font-medium text-fg mb-2">{t.stance}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStance("yes")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stance === "yes"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-fg hover:bg-muted/80"
                }`}
              >
                {t.yes}
              </button>
              <button
                type="button"
                onClick={() => setStance("no")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stance === "no"
                    ? "bg-red-500 text-white"
                    : "bg-muted text-fg hover:bg-muted/80"
                }`}
              >
                {t.no}
              </button>
              <button
                type="button"
                onClick={() => setStance("hold")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stance === "hold"
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-fg hover:bg-muted/80"
                }`}
              >
                {t.hold}
              </button>
            </div>
          </div>

          {/* 理由入力（必須） */}
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              {t.reason} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasonBody}
              onChange={(e) => setReasonBody(e.target.value)}
              placeholder={t.reasonPlaceholder}
              className="w-full p-3 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-fg hover:bg-muted transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reasonBody.trim() || isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "..." : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
