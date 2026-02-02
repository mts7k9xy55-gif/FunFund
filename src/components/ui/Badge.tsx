// src/components/ui/Badge.tsx
// タイプに応じた色を返すバッジコンポーネント
// 既存ロジックは変えず、表示だけ整える

type BadgeType = "PROPOSAL" | "COMMENT" | "EVALUATION" | string;

const typeStyles: Record<string, string> = {
  PROPOSAL: "bg-blue-100 text-blue-700 border-blue-200",
  COMMENT: "bg-slate-100 text-slate-600 border-slate-200",
  EVALUATION: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Badge({ type }: { type: BadgeType }) {
  const style = typeStyles[type] || "bg-slate-100 text-slate-600 border-slate-200";
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${style}`}
    >
      {type}
    </span>
  );
}
