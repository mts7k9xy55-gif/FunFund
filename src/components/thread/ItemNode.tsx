// src/components/thread/ItemNode.tsx
// This component displays a single item in the thread view.
// It is a pure presentational component that receives item data and depth as props.
// It handles UI aspects like indentation and expanding/collapsing children, but no data fetching.

import { useState } from "react";

// Mock data types (temporary, will be moved to a higher-level component)
const MOCK_ITEMS = [
  {
    id: "1",
    type: "PROPOSAL",
    content: "Should we implement feature X?",
    userId: "user1",
    userName: "Alice",
    parentId: null,
    createdAt: Date.now() - 3600000,
    children: [] as any[], // Children are rendered by recursive ItemNode
  },
];

type Item = (typeof MOCK_ITEMS)[0] | (typeof MOCK_ITEMS)[0]["children"][0];

export default function ItemNode({
  item,
  depth,
}: {
  item: Item;
  depth: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = "children" in item && item.children && item.children.length > 0;

  return (
    <div className="space-y-2" style={{ marginLeft: `${depth * 24}px` }}>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors">
        {/* Header */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold">
            {item.userName[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{item.userName}</span>
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded ${
                  item.type === "PROPOSAL"
                    ? "bg-blue-600 text-white"
                    : item.type === "EVALUATION"
                    ? "bg-purple-600 text-white"
                    : item.type === "COMMENT"
                    ? "bg-neutral-700 text-neutral-300"
                    : "bg-yellow-600 text-white"
                }`}
              >
                {item.type}
              </span>
              <span className="text-xs text-neutral-500">
                {new Date(item.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-neutral-200 mb-2 ml-11">{item.content}</div>

        {/* Score & Reason (for EVALUATION) */}
        {item.type === "EVALUATION" && "score" in item && item.score && (
          <div className="mt-3 ml-11 p-3 bg-purple-950 border border-purple-800 rounded">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-300">SCORE:</span>
              <span className="text-lg font-bold text-purple-200">{item.score}/10</span>
            </div>
            {"reason" in item && item.reason && (
              <div className="text-xs text-purple-300">
                <span className="font-bold">Reason: </span>
                {item.reason}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 ml-11 text-xs text-neutral-500 hover:text-neutral-300 font-medium"
          >
            {isExpanded ? "▼" : "▶"} {item.children.length} replies
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {item.children.map((child) => (
            <ItemNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
