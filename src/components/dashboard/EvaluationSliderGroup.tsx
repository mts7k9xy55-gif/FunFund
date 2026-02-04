// src/components/dashboard/EvaluationSliderGroup.tsx
// 5つのスライダー + 重み%調整 + リアルタイム加重平均スコア表示

"use client";

import { useState, useEffect, useMemo } from "react";
import { EVALUATION_CRITERIA } from "../../../convex/evaluations";

type EvaluationMode = "open" | "closed";

interface EvaluationSliderGroupProps {
  mode: EvaluationMode;
  initialScores?: [number, number, number, number, number];
  initialWeights?: [number, number, number, number, number];
  onScoresChange?: (scores: [number, number, number, number, number]) => void;
  onWeightsChange?: (weights: [number, number, number, number, number]) => void;
  onWeightedScoreChange?: (score: number) => void;
  disabled?: boolean;
  language?: "ja" | "en";
}

export default function EvaluationSliderGroup({
  mode,
  initialScores = [3, 3, 3, 3, 3],
  initialWeights = [20, 20, 20, 20, 20],
  onScoresChange,
  onWeightsChange,
  onWeightedScoreChange,
  disabled = false,
  language = "ja",
}: EvaluationSliderGroupProps) {
  const [scores, setScores] = useState<[number, number, number, number, number]>(
    initialScores
  );
  const [weights, setWeights] = useState<[number, number, number, number, number]>(
    initialWeights
  );

  // 基準名を取得
  const criteria = EVALUATION_CRITERIA[mode];

  // 重みの合計を計算
  const totalWeight = useMemo(() => {
    return weights.reduce((sum, w) => sum + w, 0);
  }, [weights]);

  // 重みを100%に正規化
  const normalizedWeights = useMemo(() => {
    if (totalWeight === 0) return [20, 20, 20, 20, 20] as [number, number, number, number, number];
    return weights.map((w) => (w / totalWeight) * 100) as [
      number,
      number,
      number,
      number,
      number
    ];
  }, [weights, totalWeight]);

  // 加重平均スコアを計算
  const weightedScore = useMemo(() => {
    const weightedSum = scores.reduce(
      (sum, score, i) => sum + score * (normalizedWeights[i] / 100),
      0
    );
    return Math.round(weightedSum * 100) / 100;
  }, [scores, normalizedWeights]);

  // スコア変更時に親に通知
  useEffect(() => {
    onScoresChange?.(scores);
  }, [scores, onScoresChange]);

  // 重み変更時に親に通知
  useEffect(() => {
    onWeightsChange?.(weights);
  }, [weights, onWeightsChange]);

  // 加重平均スコア変更時に親に通知
  useEffect(() => {
    onWeightedScoreChange?.(weightedScore);
  }, [weightedScore, onWeightedScoreChange]);

  // 初期値が変更された場合に更新
  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  useEffect(() => {
    setWeights(initialWeights);
  }, [initialWeights]);

  const handleScoreChange = (index: number, value: number) => {
    const newScores = [...scores] as [number, number, number, number, number];
    newScores[index] = Math.max(1, Math.min(5, value));
    setScores(newScores);
  };

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...weights] as [number, number, number, number, number];
    newWeights[index] = Math.max(0, Math.min(100, value));
    setWeights(newWeights);
  };

  return (
    <div className="w-full space-y-6">
      {/* 加重平均スコア表示 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {language === "ja" ? "加重平均スコア" : "Weighted Average Score"}
          </span>
          <span className="text-3xl font-bold text-primary">
            {weightedScore.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(weightedScore / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* スライダーグループ */}
      <div className="space-y-4">
        {[0, 1, 2, 3, 4].map((index) => {
          const scoreKey = `score${index + 1}` as keyof typeof criteria;
          const label = criteria[scoreKey];

          return (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              {/* ラベルとスコア表示 */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {label}
                </label>
                <span className="text-lg font-semibold text-primary">
                  {scores[index]}
                </span>
              </div>

              {/* スコアスライダー */}
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={scores[index]}
                onChange={(e) =>
                  handleScoreChange(index, parseFloat(e.target.value))
                }
                disabled={disabled}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* スコア目盛り */}
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>

              {/* 重み調整 */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "ja" ? "重み" : "Weight"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={weights[index]}
                      onChange={(e) =>
                        handleWeightChange(
                          index,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={disabled}
                      className="w-16 px-2 py-1 text-sm border border-border rounded bg-background text-foreground disabled:opacity-50"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <span className="text-xs text-muted-foreground">
                      ({normalizedWeights[index].toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={weights[index]}
                  onChange={(e) =>
                    handleWeightChange(index, parseFloat(e.target.value))
                  }
                  disabled={disabled}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 重み合計表示 */}
      <div className="text-center text-sm text-muted-foreground">
        {language === "ja" ? "重み合計" : "Total Weight"}: {totalWeight.toFixed(1)}%
        {totalWeight !== 100 && (
          <span className="ml-2 text-orange-500">
            ({language === "ja" ? "自動調整されます" : "Will be auto-adjusted"})
          </span>
        )}
      </div>
    </div>
  );
}
