// src/components/dashboard/Dashboard.tsx
// メインダッシュボードUI: 評価スライダー、仮想Fund残高、分配提案

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import EvaluationSliderGroup from "./EvaluationSliderGroup";
import StatsCard from "./StatsCard";
import ActivityFeed from "./ActivityFeed";
import { Star, TrendingUp, Users, DollarSign } from "lucide-react";

interface DashboardProps {
  roomId: Id<"rooms">;
  threadId?: Id<"threads">;
  language?: "ja" | "en";
}

export default function Dashboard({
  roomId,
  threadId,
  language = "ja",
}: DashboardProps) {
  const [scores, setScores] = useState<[number, number, number, number, number]>([
    3, 3, 3, 3, 3,
  ]);
  const [weights, setWeights] = useState<[number, number, number, number, number]>([
    20, 20, 20, 20, 20,
  ]);
  const [weightedScore, setWeightedScore] = useState(3.0);
  const [comment, setComment] = useState("");

  // Room情報を取得
  const room = useQuery(api.rooms.getRoom, { roomId });
  const evaluationMode = room?.evaluationMode ?? "open";

  // 自分の評価を取得
  const myEvaluation = useQuery(
    api.evaluations.getMyEvaluation,
    threadId ? { threadId } : "skip"
  );

  // 仮想Fund残高を取得
  const virtualFund = useQuery(api.rooms.getRoomVirtualFundBalance, { roomId });

  // 分配提案一覧を取得
  const distributionProposals = useQuery(
    api.distributions.getDistributionProposals,
    { roomId }
  );

  // Room内のThread一覧を取得（統計用）
  const roomThreads = useQuery(api.threads.listThreads, { roomId }) ?? [];

  // 自動計算された貢献度を取得
  const autoContributions = useQuery(
    api.distributions.calculateContributionsFromEvaluations,
    threadId
      ? { roomId, threadId }
      : { roomId, threadId: undefined }
  );

  // Mutations
  const upsertEvaluation = useMutation(api.evaluations.upsertEvaluation);
  const createDistributionProposal = useMutation(
    api.distributions.createDistributionProposal
  );
  const updateVirtualFund = useMutation(api.rooms.updateRoomVirtualFundBalance);

  // 既存の評価がある場合は初期値を設定
  useEffect(() => {
    if (myEvaluation) {
      setScores([
        myEvaluation.score1,
        myEvaluation.score2,
        myEvaluation.score3,
        myEvaluation.score4,
        myEvaluation.score5,
      ]);
      setWeights([
        myEvaluation.weight1,
        myEvaluation.weight2,
        myEvaluation.weight3,
        myEvaluation.weight4,
        myEvaluation.weight5,
      ]);
      setComment(myEvaluation.comment ?? "");
    }
  }, [myEvaluation]);

  // 評価を保存
  const handleSaveEvaluation = async () => {
    if (!threadId) return;

    try {
      await upsertEvaluation({
        threadId,
        mode: evaluationMode,
        score1: scores[0],
        score2: scores[1],
        score3: scores[2],
        score4: scores[3],
        score5: scores[4],
        weight1: weights[0],
        weight2: weights[1],
        weight3: weights[2],
        weight4: weights[3],
        weight5: weights[4],
        comment: comment || undefined,
      });

      // 仮想Fund残高を更新
      await updateVirtualFund({ roomId });

      alert(language === "ja" ? "評価を保存しました" : "Evaluation saved");
    } catch (error: any) {
      console.error("Failed to save evaluation:", error);
      alert(
        language === "ja"
          ? `エラー: ${error.message}`
          : `Error: ${error.message}`
      );
    }
  };

  // 分配提案を作成
  const handleCreateDistributionProposal = async () => {
    if (!autoContributions || autoContributions.length === 0) {
      alert(
        language === "ja"
          ? "貢献度を計算できませんでした"
          : "Could not calculate contributions"
      );
      return;
    }

    if (!threadId) {
      alert(
        language === "ja"
          ? "Threadが選択されていません"
          : "Thread is not selected"
      );
      return;
    }

    const totalAmount = virtualFund?.balance ?? 0;

    if (totalAmount === 0) {
      alert(
        language === "ja"
          ? "仮想Fund残高が0です"
          : "Virtual fund balance is 0"
      );
      return;
    }

    try {
      await createDistributionProposal({
        roomId,
        threadId,
        contributions: autoContributions,
        totalAmount,
      });

      alert(
        language === "ja"
          ? "分配提案を作成しました"
          : "Distribution proposal created"
      );
    } catch (error: any) {
      console.error("Failed to create distribution proposal:", error);
      alert(
        language === "ja"
          ? `エラー: ${error.message}`
          : `Error: ${error.message}`
      );
    }
  };

  // モックアクティビティデータ（実際のデータに置き換える）
  const mockActivities = [
    {
      id: "1",
      type: "evaluation" as const,
      title: "新しい評価が追加されました",
      description: "プロジェクト「サンプルプロジェクト」に評価が追加されました",
      timestamp: Date.now() - 3600000,
      user: "ユーザー1",
    },
    {
      id: "2",
      type: "project" as const,
      title: "新しいプロジェクトが作成されました",
      description: "プロジェクト「新機能開発」が作成されました",
      timestamp: Date.now() - 7200000,
      user: "ユーザー2",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={language === "ja" ? "総評価数" : "Total Evaluations"}
          value={virtualFund?.threadCount ?? 0}
          icon={Star}
          language={language}
        />
        <StatsCard
          title={language === "ja" ? "仮想Fund残高" : "Virtual Fund Balance"}
          value={`¥${(virtualFund?.balance ?? 0).toLocaleString()}`}
          icon={DollarSign}
          language={language}
        />
        <StatsCard
          title={language === "ja" ? "アクティブプロジェクト" : "Active Projects"}
          value={roomThreads?.length ?? 0}
          icon={TrendingUp}
          language={language}
        />
        <StatsCard
          title={language === "ja" ? "メンバー数" : "Members"}
          value={10}
          icon={Users}
          language={language}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 評価と分配提案 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 仮想Fund残高表示 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {language === "ja" ? "仮想Fund残高" : "Virtual Fund Balance"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {language === "ja"
                ? `${virtualFund?.threadCount ?? 0}件のThreadから計算`
                : `Calculated from ${virtualFund?.threadCount ?? 0} threads`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ¥{virtualFund?.balance?.toLocaleString() ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* 評価スライダーグループ */}
      {threadId && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {language === "ja" ? "評価" : "Evaluation"}
          </h2>

          <EvaluationSliderGroup
            mode={evaluationMode}
            initialScores={scores}
            initialWeights={weights}
            onScoresChange={(newScores) =>
              setScores(newScores as [number, number, number, number, number])
            }
            onWeightsChange={(newWeights) =>
              setWeights(
                newWeights as [number, number, number, number, number]
              )
            }
            onWeightedScoreChange={setWeightedScore}
            language={language}
          />

          {/* コメント入力 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "ja" ? "コメント（任意）" : "Comment (optional)"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                language === "ja"
                  ? "評価に関するコメントを入力..."
                  : "Enter your comment..."
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSaveEvaluation}
            className="mt-4 w-full md:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {language === "ja" ? "評価を保存" : "Save Evaluation"}
          </button>
        </div>
      )}

      {/* 分配提案セクション */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {language === "ja" ? "分配提案" : "Distribution Proposal"}
        </h2>

        {autoContributions && autoContributions.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {language === "ja"
                ? "評価スコアに基づく自動計算された貢献度:"
                : "Auto-calculated contributions based on evaluation scores:"}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ja"
                ? "※ ユーザー基準重み + プロジェクト別重みを反映"
                : "* Includes global + project-specific user weights"}
            </p>

            <div className="space-y-2">
              {autoContributions.map((contribution, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm font-medium text-foreground">
                    {contribution.userId}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {contribution.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleCreateDistributionProposal}
              className="w-full md:w-auto px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {language === "ja"
                ? "分配提案を作成"
                : "Create Distribution Proposal"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {language === "ja"
              ? "評価データが不足しています"
              : "Insufficient evaluation data"}
          </p>
        )}
      </div>

          {/* 分配提案一覧 */}
          {distributionProposals && distributionProposals.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {language === "ja" ? "提案一覧" : "Proposals"}
              </h2>

              <div className="space-y-4">
            {distributionProposals.map((proposal) => (
              <div
                key={proposal._id}
                className="p-4 bg-muted rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">
                    {language === "ja" ? "提案者" : "Proposed by"}:{" "}
                    {proposal.proposedBy}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      proposal.status === "accepted"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : proposal.status === "rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {proposal.status === "accepted"
                      ? language === "ja"
                        ? "承認済み"
                        : "Accepted"
                      : proposal.status === "rejected"
                      ? language === "ja"
                        ? "却下"
                        : "Rejected"
                      : language === "ja"
                      ? "保留中"
                      : "Pending"}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {language === "ja" ? "総額" : "Total Amount"}: ¥
                  {proposal.totalAmount.toLocaleString()}
                </div>

                <div className="space-y-2">
                  {proposal.contributions.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{c.userId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {c.percentage.toFixed(1)}%
                        </span>
                        <span className="text-primary font-medium">
                          ¥
                          {Math.round(
                            (proposal.totalAmount * c.percentage) / 100
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
              </div>
            </div>
          )}
        </div>

        {/* 右側: アクティビティフィード */}
        <div className="lg:col-span-1">
          <ActivityFeed activities={mockActivities} language={language} />
        </div>
      </div>
    </div>
  );
}
