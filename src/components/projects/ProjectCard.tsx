// src/components/projects/ProjectCard.tsx
// プロジェクトカードコンポーネント（グリッド表示用）

"use client";

import Link from "next/link";
import { Star, Users, Calendar, TrendingUp } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  category?: string;
  weightedScore?: number;
  evaluationCount?: number;
  currentAmount?: number;
  goalAmount?: number;
  daysRemaining?: number;
  language?: "ja" | "en";
}

export default function ProjectCard({
  id,
  title,
  description,
  thumbnailUrl,
  category,
  weightedScore = 0,
  evaluationCount = 0,
  currentAmount = 0,
  goalAmount = 0,
  daysRemaining,
  language = "ja",
}: ProjectCardProps) {
  const progressPercentage = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;
  const displayScore = weightedScore.toFixed(1);

  return (
    <Link
      href={`/public/${id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in"
    >
      {/* サムネイル */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
            <TrendingUp className="w-12 h-12 text-indigo-300" />
          </div>
        )}
        
        {/* カテゴリバッジ */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-gray-700">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div className="p-5 space-y-4">
        {/* タイトルと説明 */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        </div>

        {/* 重み付きスコア */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">{displayScore}</span>
          </div>
          <span className="text-xs text-gray-500">
            ({evaluationCount} {language === "ja" ? "評価" : "evaluations"})
          </span>
        </div>

        {/* 資金調達プログレスバー */}
        {goalAmount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                ¥{currentAmount.toLocaleString()}
              </span>
              <span className="text-gray-500">
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{language === "ja" ? "目標" : "Goal"}: ¥{goalAmount.toLocaleString()}</span>
              {daysRemaining !== undefined && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{daysRemaining} {language === "ja" ? "日" : "days"}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTAボタン */}
        <button className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
          {language === "ja" ? "詳細を見る" : "View Details"}
        </button>
      </div>
    </Link>
  );
}
