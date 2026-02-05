// src/app/public/page.tsx
// オープン一覧ページ（改善版：フィルター、検索バー、プロジェクトカード）

"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectFilters from "@/components/projects/ProjectFilters";
import { TrendingUp } from "lucide-react";

export default function PublicListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 5 });

  const previews = useQuery(api.publicPreviews.listPublicPreviews) ?? [];

  // フィルタリング
  const filteredPreviews = useMemo(() => {
    return previews.filter((preview) => {
      // 検索クエリ
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !preview.title?.toLowerCase().includes(query) &&
          !preview.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // カテゴリー（実装が必要な場合は追加）
      // if (selectedCategory !== "all" && preview.category !== selectedCategory) {
      //   return false;
      // }

      return true;
    });
  }, [previews, searchQuery, selectedCategory, selectedStatus, scoreRange]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FunFund</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <SignedIn>
                <Link
                  href="/room"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  グループに入る
                </Link>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                    ログイン
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            オープンプロジェクト
          </h1>
          <p className="text-gray-600">
            重み付き評価システムで、本当に価値あるプロジェクトを発見しよう
          </p>
        </div>

        {/* フィルター */}
        <div className="mb-8">
          <ProjectFilters
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onStatusChange={setSelectedStatus}
            onScoreRangeChange={(min, max) => setScoreRange({ min, max })}
            language="ja"
          />
        </div>

        {/* プロジェクトグリッド */}
        {filteredPreviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "該当するプロジェクトが見つかりません"
                : "まだプロジェクトがありません"}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchQuery || selectedCategory !== "all" || selectedStatus !== "all"
                ? "フィルターを変更して再度お試しください"
                : "最初のプロジェクトを作成しましょう"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPreviews.map((preview) => (
              <ProjectCard
                key={preview.id}
                id={preview.id}
                title={preview.title}
                description={preview.description || ""}
                thumbnailUrl={preview.thumbnailUrl}
                category={preview.category}
                weightedScore={4.2} // TODO: 実際のスコアを取得
                evaluationCount={12} // TODO: 実際の評価数を取得
                currentAmount={500000} // TODO: 実際の金額を取得
                goalAmount={1000000} // TODO: 実際の目標額を取得
                daysRemaining={30} // TODO: 実際の残り日数を取得
                language="ja"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
