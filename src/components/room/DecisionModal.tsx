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

type DecisionVisibility = "private" | "shared_to_target" | "public";

export default function DecisionModal({
  isOpen,
  onClose,
  roomId,
  threadId,
  language,
  onError,
  onSuccess,
}: DecisionModalProps) {
  const [score, setScore] = useState(5);
  const [reasonBody, setReasonBody] = useState("");
  const [visibility, setVisibility] = useState<DecisionVisibility>("private");
  const [publishConsentByEvaluator, setPublishConsentByEvaluator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const decide = useMutation(api.decisions.decide);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reasonBody.trim()) {
      const msg =
        language === "ja" ? "判断理由を入力してください" : "Please enter a decision reason";
      onError?.(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await decide({
        roomId,
        threadId,
        score,
        reasonBody: reasonBody.trim(),
        visibility,
        publishConsentByEvaluator,
      });

      onSuccess?.(language === "ja" ? "判断を保存しました" : "Decision saved");
      setScore(5);
      setReasonBody("");
      setVisibility("private");
      setPublishConsentByEvaluator(false);
      onClose();
    } catch (error: any) {
      let errorMsg =
        error.message || (language === "ja" ? "判断の保存に失敗しました" : "Failed to save decision");
      if (error.message?.includes("not active")) {
        errorMsg = language === "ja" ? "このRoomは有効化が必要です" : "This room needs activation";
      } else if (error.message?.includes("Viewers cannot write")) {
        errorMsg = language === "ja" ? "viewerは書き込みできません" : "Viewers cannot write";
      } else if (error.message?.includes("reason")) {
        errorMsg = language === "ja" ? "判断理由を入力してください" : "Please enter a reason";
      }
      onError?.(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = {
    title: language === "ja" ? "判断を記録" : "Record Decision",
    score: language === "ja" ? "評価スコア (1-10)" : "Decision Score (1-10)",
    reason: language === "ja" ? "判断理由（必須）" : "Reason (required)",
    reasonPlaceholder:
      language === "ja"
        ? "なぜこの点数にしたかを簡潔に記入してください"
        : "Describe why you chose this score",
    visibility: language === "ja" ? "公開範囲" : "Visibility",
    private: language === "ja" ? "秘匿（自分のみ）" : "Private (only me)",
    shared: language === "ja" ? "対象者に共有" : "Share with target",
    public: language === "ja" ? "公開（両者同意時）" : "Public (requires both consents)",
    evaluatorConsent:
      language === "ja"
        ? "公開に同意する（対象者が同意すると公開）"
        : "I consent to publishing if target also consents",
    submit: language === "ja" ? "保存" : "Save",
    cancel: language === "ja" ? "キャンセル" : "Cancel",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl mx-4">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold text-fg">{t.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-fg transition-colors hover:text-fg"
            aria-label={t.cancel}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-fg">{t.score}</label>
            <div className="rounded-lg border border-border bg-muted p-3">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
                className="w-full"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-fg">
                <span>1</span>
                <span className="rounded bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                  {score}
                </span>
                <span>10</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg">
              {t.reason} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reasonBody}
              onChange={(event) => setReasonBody(event.target.value)}
              placeholder={t.reasonPlaceholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-muted p-3 text-sm text-fg placeholder-muted-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-fg">{t.visibility}</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as DecisionVisibility)}
              className="w-full rounded-lg border border-border bg-muted p-3 text-sm text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="private">{t.private}</option>
              <option value="shared_to_target">{t.shared}</option>
              <option value="public">{t.public}</option>
            </select>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-fg">
            <input
              type="checkbox"
              checked={publishConsentByEvaluator}
              onChange={(event) => setPublishConsentByEvaluator(event.target.checked)}
              className="mt-0.5"
            />
            <span>{t.evaluatorConsent}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-5">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-fg transition-colors hover:bg-muted"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reasonBody.trim() || isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "..." : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
