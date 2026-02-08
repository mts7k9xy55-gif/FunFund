// src/components/composer/CommitModal.tsx
// Emergent型「投票」モーダル：賛成/中立/反対 + コミット強度スライダー
// 画像の通りに実装

import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

type VoteType = "approve" | "neutral" | "oppose";

export default function CommitModal({
  isOpen,
  onClose,
  language,
  parentId,
  userId,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  language: "ja" | "en";
  parentId: Id<"items"> | null;
  userId: Id<"users"> | undefined;
  onSubmit: (voteType: VoteType, commitStrength: number, reason: string) => Promise<void>;
}) {
  const [voteType, setVoteType] = useState<VoteType>("approve");
  const [commitStrength, setCommitStrength] = useState(5);
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!parentId || !userId || !reason.trim()) {
      // 理由は必須
      return;
    }

    try {
      await onSubmit(voteType, commitStrength, reason);
      handleReset();
      onClose();
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const handleReset = () => {
    setVoteType("approve");
    setCommitStrength(5);
    setReason("");
  };

  const strengthOptions = [
    { value: 3, labelJa: "軽め", labelEn: "Light" },
    { value: 5, labelJa: "標準", labelEn: "Standard" },
    { value: 8, labelJa: "強め", labelEn: "Strong" },
  ];

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal: Emergent型（黄ハイライト背景） */}
      <div className="relative w-full max-w-lg mx-4 bg-amber-50 border border-amber-200 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-200">
          <h2 className="text-lg font-semibold text-fg">
            {language === "ja" ? "投票" : "Vote"}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* 投票選択：賛成/中立/反対 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVoteType("approve")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                voteType === "approve"
                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                  : "bg-card text-fg border border-border hover:bg-muted"
              }`}
            >
              {language === "ja" ? "賛成" : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => setVoteType("neutral")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                voteType === "neutral"
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-card text-fg border border-border hover:bg-muted"
              }`}
            >
              {language === "ja" ? "中立" : "Neutral"}
            </button>
            <button
              type="button"
              onClick={() => setVoteType("oppose")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                voteType === "oppose"
                  ? "bg-red-100 text-red-700 border-2 border-red-300"
                  : "bg-card text-fg border border-border hover:bg-muted"
              }`}
            >
              {language === "ja" ? "反対" : "Oppose"}
            </button>
          </div>

          {/* コミット強度：詳細設定は廃止し、3段階のクイック選択に統一 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-fg">
                {language === "ja" ? "コミット強度" : "Commit Strength"}
              </label>
              <span className="text-2xl font-bold text-fg">{commitStrength}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {strengthOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCommitStrength(option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    commitStrength === option.value
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-card text-fg hover:bg-muted"
                  }`}
                >
                  {language === "ja" ? option.labelJa : option.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* 理由入力 */}
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              {language === "ja" ? "理由" : "Reason"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                language === "ja"
                  ? "判断の理由を記入..."
                  : "Enter reason for judgment..."
              }
              className="w-full p-3 bg-card border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-amber-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-fg hover:bg-muted transition-colors"
          >
            {language === "ja" ? "キャンセル" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || !parentId || !userId}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === "ja" ? "判断を確定" : "Confirm Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
