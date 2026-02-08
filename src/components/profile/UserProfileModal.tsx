// src/components/profile/UserProfileModal.tsx
// ユーザープロフィール：信頼度（reputation）とその内訳（Σ=x）を表示

"use client";

import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function UserProfileModal({
  isOpen,
  onClose,
  userId,
  language,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users"> | null;
  language: "ja" | "en";
}) {
  const reputation = useQuery(
    api.items.getUserReputation,
    userId ? { userId } : "skip"
  );
  const weightProfile = useQuery(
    api.weights.getWeightProfileByUser,
    userId ? { userId } : "skip"
  );
  const evaluations = useQuery(
    api.items.getUserEvaluations,
    userId ? { userId } : "skip"
  );
  const users = useQuery(api.users.listUsers);
  const viewedUser = users?.find((u) => u._id === userId);
  const { user: clerkUser } = useUser();
  const updateWeightProfileVisibility = useMutation(
    api.weights.updateMyWeightProfileVisibility
  );
  const isOwnProfile = clerkUser?.id === viewedUser?.userId;

  if (!isOpen || !userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">
            {language === "ja" ? "プロフィール" : "Profile"}
          </h2>
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
        <div className="p-5 space-y-6">
          {/* ユーザー情報 */}
          <div>
            <h3 className="text-xl font-bold text-fg mb-2">
              {viewedUser?.name ?? "Unknown User"}
            </h3>
            <div className="text-sm text-muted-fg">
              {language === "ja" ? "ユーザーID" : "User ID"}: {viewedUser?.userId}
            </div>
          </div>

          {/* 信頼度 */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-medium text-muted-fg">
                {language === "ja" ? "信頼度" : "Reputation"}
              </span>
              <span className="text-3xl font-bold text-primary">
                {reputation !== undefined
                  ? reputation.toFixed(2)
                  : "計算中..."}
              </span>
            </div>
            <p className="text-xs text-muted-fg">
              {language === "ja"
                ? "過去の判断履歴に基づく信頼度（フラクタル評価）"
                : "Trust score based on past evaluation history (fractal evaluation)"}
            </p>
          </div>

          {/* 重みプロファイル */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-medium text-slate-600">
                {language === "ja" ? "重み (global)" : "Global Weight"}
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {weightProfile?.globalWeight?.toFixed(2) ??
                  (language === "ja" ? "非公開" : "Private")}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {language === "ja"
                ? "FunFund全体で使われる基準重み"
                : "Baseline weight used across FunFund"}
            </p>

            {isOwnProfile ? (
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={weightProfile?.publicProfileEnabled ?? false}
                  onChange={async (event) => {
                    await updateWeightProfileVisibility({
                      publicProfileEnabled: event.target.checked,
                    });
                  }}
                />
                {language === "ja"
                  ? "この重みと実績を公開する"
                  : "Publish this weight profile"}
              </label>
            ) : null}
          </div>

          {/* 評価履歴の内訳（Σ=x） */}
          <div>
            <h4 className="text-base font-semibold text-fg mb-3">
              {language === "ja" ? "判断履歴の内訳" : "Evaluation History Breakdown"}
            </h4>
            {evaluations === undefined ? (
              <div className="text-sm text-muted-fg">
                {language === "ja" ? "読み込み中..." : "Loading..."}
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-sm text-muted-fg">
                {language === "ja"
                  ? "まだ評価がありません"
                  : "No evaluations yet"}
              </div>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evalItem) => (
                  <div
                    key={evalItem._id}
                    className="p-3 bg-muted border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-fg">
                          {language === "ja" ? "評価" : "Evaluation"} #{evalItem._id.slice(-8)}
                        </div>
                        <div className="text-xs text-muted-fg mt-1">
                          {new Date(evalItem.createdAt).toLocaleString(
                            language === "ja" ? "ja-JP" : "en-US"
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {evalItem.score !== undefined
                            ? evalItem.score > 0
                              ? `+${evalItem.score}`
                              : evalItem.score
                            : "N/A"}
                        </div>
                        <div className="text-xs text-muted-fg">
                          {language === "ja" ? "スコア" : "Score"}
                        </div>
                      </div>
                    </div>

                    {evalItem.reason && (
                      <div className="text-sm text-fg mb-2">{evalItem.reason}</div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-fg">
                          {language === "ja" ? "対象の最終スコア" : "Target Final Score"}:
                        </span>
                        <span className="ml-1 font-medium text-fg">
                          {evalItem.targetFinalScore.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-fg">
                          {language === "ja"
                            ? "この評価への評価"
                            : "Evaluation of This"}:
                        </span>
                        <span className="ml-1 font-medium text-fg">
                          {evalItem.evalOfEvalScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Σ=x の説明 */}
          <div className="p-3 bg-muted/50 border border-border rounded-lg">
            <div className="text-sm font-medium text-fg mb-1">
              {language === "ja" ? "Σ = " : "Σ = "}
              {reputation !== undefined ? reputation.toFixed(2) : "..."}
            </div>
            <p className="text-xs text-muted-fg">
              {language === "ja"
                ? "全ての過去評価の「的中度」と、その評価自体が受けた評価（フラクタル）を加味した総合的な信頼度"
                : "Overall trust score calculated from the accuracy of all past evaluations and the evaluations those evaluations received (fractal)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
