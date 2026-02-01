// src/components/composer/ItemComposer.tsx
// This component provides the UI for creating new items (reactions, comments, evaluations).
// It handles the UI state for the 3 composer modes and their respective inputs,
// but does not contain any logic for submitting the data to the backend.

import { useState } from "react";

type ComposerMode = "reaction" | "comment" | "evaluation";

export default function ItemComposer({
  mode,
  onModeChange,
}: {
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
}) {
  const [content, setContent] = useState("");
  const [score, setScore] = useState(5);
  const [reason, setReason] = useState("");

  return (
    <div className="border-t border-neutral-800 bg-neutral-900 p-4">
      <div className="max-w-4xl">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onModeChange("reaction")}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              mode === "reaction"
                ? "bg-yellow-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            REACTION
          </button>
          <button
            onClick={() => onModeChange("comment")}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              mode === "comment"
                ? "bg-neutral-700 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            COMMENT
          </button>
          <button
            onClick={() => onModeChange("evaluation")}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              mode === "evaluation"
                ? "bg-purple-600 text-white"
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
            }`}
          >
            EVALUATION
          </button>
        </div>

        {/* Composer Input */}
        {mode === "reaction" && (
          <div className="flex gap-2">
            {["👍", "❤️", "🎉", "🤔", "👎"].map((emoji) => (
              <button
                key={emoji}
                className="text-2xl hover:scale-110 transition-transform p-2 hover:bg-neutral-800 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {mode === "comment" && (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
              rows={3}
            />
            <button className="mt-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded transition-colors">
              Send
            </button>
          </div>
        )}

        {mode === "evaluation" && (
          <div className="space-y-3">
            {/* Score Slider */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">
                SCORE: {score}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: "#9333ea",
                }}
              />
              <div className="flex justify-between text-xs text-neutral-600 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            {/* Reason (required) */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">
                REASON (required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this score? (required for evaluation)"
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                rows={2}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">
                CONTENT
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Additional context..."
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-600"
                rows={3}
              />
            </div>

            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded transition-colors">
              Submit Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
