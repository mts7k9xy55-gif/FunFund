// src/components/thread/ThreadView.tsx
// This component acts as a container for displaying a list of items in a thread format.
// It receives an array of root items as props and recursively renders ItemNode components.
// It is a pure presentational component that orchestrates the display of the thread.

import ItemNode from "./ItemNode";

// アイテムの型定義
type ThreadItem = {
  id: string;
  type: string;
  content: string;
  userId: string;
  userName: string;
  parentId: string | null;
  createdAt: number;
  children?: ThreadItem[];
  score?: number;
  reason?: string;
};

export default function ThreadView({
  items,
  onOpenCommit,
  onOpenProjectCreate,
  onOpenComment,
  onOpenProfile,
  language,
}: {
  items: ThreadItem[];
  onOpenCommit?: (itemId: string) => void;
  onOpenProjectCreate?: () => void;
  onOpenComment?: () => void;
  onOpenProfile?: (userId: string) => void;
  language: "ja" | "en";
}) {
  // 全体議論は複数の独立したスレッド（カード）が並ぶ形式
  // ローンチ前なので空の状態を表示
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-fg text-sm">
          {language === "ja"
            ? "まだスレッドがありません。最初のスレッドを作成しましょう。"
            : "No threads yet. Create the first thread."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 全体議論：各カードが独立したスレッド（返信は各カード内で展開） */}
      {items.map((item) => (
        <ItemNode
          key={item.id}
          item={item}
          depth={0}
          onOpenCommit={onOpenCommit}
          onOpenProjectCreate={onOpenProjectCreate}
          onOpenComment={onOpenComment}
          onOpenProfile={onOpenProfile}
          language={language}
        />
      ))}
    </div>
  );
}
