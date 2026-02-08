// src/components/projects/ProjectFilters.tsx
// プロジェクトフィルターコンポーネント

"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface ProjectFiltersProps {
  onSearchChange?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  onStatusChange?: (status: string) => void;
  onScoreRangeChange?: (min: number, max: number) => void;
  language?: "ja" | "en";
}

const categories = [
  { value: "all", label: "すべて" },
  { value: "tech", label: "テクノロジー" },
  { value: "social", label: "社会課題" },
  { value: "art", label: "アート" },
  { value: "food", label: "フード" },
  { value: "other", label: "その他" },
];

const statuses = [
  { value: "all", label: "すべて" },
  { value: "active", label: "募集中" },
  { value: "funded", label: "達成済み" },
  { value: "ending", label: "終了間近" },
];

export default function ProjectFilters({
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onScoreRangeChange,
  language = "ja",
}: ProjectFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(5);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange?.(value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onStatusChange?.(value);
  };

  const handleScoreRangeChange = (min: number, max: number) => {
    setScoreMin(min);
    setScoreMax(max);
    onScoreRangeChange?.(min, max);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setScoreMin(0);
    setScoreMax(5);
    onSearchChange?.("");
    onCategoryChange?.("all");
    onStatusChange?.("all");
    onScoreRangeChange?.(0, 5);
  };

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={language === "ja" ? "プロジェクトを検索..." : "Search projects..."}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* フィルターボタン（モバイル） */}
      <div className="md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          {language === "ja" ? "フィルター" : "Filters"}
        </button>
      </div>

      {/* フィルター（デスクトップ / モバイル展開時） */}
      <div className={`${showFilters ? "block" : "hidden"} md:block bg-white border border-gray-200 rounded-xl p-4 space-y-4`}>
        {/* カテゴリー */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === "ja" ? "カテゴリー" : "Category"}
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 資金調達状況 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === "ja" ? "資金調達状況" : "Funding Status"}
          </label>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status.value
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* 評価スコア範囲 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === "ja" ? "評価スコア範囲" : "Score Range"}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={scoreMin}
              onChange={(e) => handleScoreRangeChange(parseFloat(e.target.value), scoreMax)}
              className="flex-1"
            />
            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
              <span>{scoreMin.toFixed(1)}</span>
              <span>-</span>
              <span>{scoreMax.toFixed(1)}</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={scoreMax}
            onChange={(e) => handleScoreRangeChange(scoreMin, parseFloat(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        {/* クリアボタン */}
        {(selectedCategory !== "all" || selectedStatus !== "all" || searchQuery) && (
          <button
            onClick={clearFilters}
            className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {language === "ja" ? "フィルターをクリア" : "Clear Filters"}
          </button>
        )}
      </div>
    </div>
  );
}
