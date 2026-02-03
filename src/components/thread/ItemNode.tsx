// src/components/thread/ItemNode.tsx
// Emergent型カード：白基調 / 判断カードは黄ハイライト / 返信・判断ボタン / バッジなし
// 未認証時はユーザー名を非表示、信憑性度を表示

import { useState } from "react";
import { SignedIn } from "@clerk/nextjs";

// アイテムの型定義
type Item = {
  id: string;
  type: string;
  content: string;
  userId: string;
  userName: string;
  parentId: string | null;
  createdAt: number;
  children?: Item[];
  score?: number;
  reason?: string;
};

function formatTimeAgo(ms: number, language: "ja" | "en"): string {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (language === "ja") {
    if (min < 60) return `${min}分前`;
    const h = Math.floor(min / 60);
    return `${h}時間前`;
  } else {
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    return `${h}h ago`;
  }
}

export default function ItemNode({
  item,
  depth,
  onOpenCommit,
  onOpenProjectCreate,
  onOpenComment,
  onOpenProfile,
  language,
}: {
  item: Item;
  depth: number;
  onOpenCommit?: (itemId: string) => void;
  onOpenProjectCreate?: () => void;
  onOpenComment?: () => void;
  onOpenProfile?: (userId: string) => void;
  language: "ja" | "en";
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = "children" in item && item.children && item.children.length > 0;
  const isJudgment = item.type === "EVALUATION";
  // 信憑性度（credibility）: 判断履歴に基づく数値（例: 78, 92）
  // 現時点ではscoreをcredibilityとして使用（後でConvexから取得）
  const credibility = "score" in item && typeof item.score === "number" ? item.score : null;

  return (
    <div className="space-y-4" style={{ marginLeft: `${depth * 20}px` }}>
      {/* Card: Emergent型（判断カードは黄ハイライト） */}
      <div
        className={`card p-4 transition-shadow ${
          isJudgment ? "bg-amber-50 border-amber-100" : ""
        }`}
      >
        {/* Header: 名前・信憑性度(primary)・時間 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* 未認証時はユーザー名を非表示 */}
            <SignedIn>
              <button
                type="button"
                onClick={() => onOpenProfile?.(item.userId)}
                className="text-lg font-semibold leading-tight text-fg hover:text-primary transition-colors cursor-pointer"
              >
                {item.userName}
              </button>
            </SignedIn>
            {/* 信憑性度を表示 */}
            {credibility !== null && (
              <span className="text-lg font-semibold text-primary">{credibility}</span>
            )}
            <span className="text-xs text-muted-fg">
              {formatTimeAgo(item.createdAt, language)}
            </span>
          </div>
          {hasChildren && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-muted-fg hover:text-fg shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {language === "ja"
                ? `${item.children?.length ?? 0}件の返信`
                : `${item.children?.length ?? 0} replies`}
            </button>
          )}
        </div>

        {/* Content: 判断の場合は「賛成」＋本文 */}
        <div className="text-fg leading-relaxed mb-4">
          {isJudgment && (
            <span className="font-semibold text-fg mr-2">賛成</span>
          )}
          {item.content}
        </div>

        {/* Reason (EVALUATION only) */}
        {isJudgment && "reason" in item && item.reason && (
          <div className="mb-4 pl-0 text-sm text-muted-fg">
            {item.reason}
          </div>
        )}

        {/* Actions: 返信・判断のみ */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenComment}
            className="px-3 py-1.5 rounded-lg bg-muted text-fg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            {language === "ja" ? "返信" : "Reply"}
          </button>
          <button
            type="button"
            onClick={() => onOpenCommit?.(item.id)}
            className="px-3 py-1.5 rounded-lg bg-muted text-fg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            {language === "ja" ? "判断" : "Judge"}
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && item.children && (
        <div className="space-y-4">
          {item.children.map((child) => (
            <ItemNode
              key={child.id}
              item={child}
              depth={depth + 1}
              onOpenCommit={onOpenCommit}
              onOpenProjectCreate={onOpenProjectCreate}
              onOpenComment={onOpenComment}
              onOpenProfile={onOpenProfile}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
}
