// src/components/room/CreateRoomModal.tsx
// Room作成モーダル: プライベート設定と評価モード選択

"use client";

import { useState } from "react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, isPrivate: boolean, evaluationMode: "open" | "closed") => void;
  language?: "ja" | "en";
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSubmit,
  language = "ja",
}: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<"open" | "closed">("open");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit(name.trim(), isPrivate, evaluationMode);
    setName("");
    setIsPrivate(false);
    setEvaluationMode("open");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setIsPrivate(false);
    setEvaluationMode("open");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {language === "ja" ? "Roomを作成" : "Create Room"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Room名 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "ja" ? "Room名" : "Room Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                language === "ja" ? "Room名を入力..." : "Enter room name..."
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* プライベート設定 */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="isPrivate"
              className="flex-1 text-sm font-medium text-foreground cursor-pointer"
            >
              {language === "ja"
                ? "プライベートグループ（招待コードが必要）"
                : "Private group (invite code required)"}
            </label>
          </div>

          {/* 評価モード */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "ja" ? "評価モード" : "Evaluation Mode"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEvaluationMode("open")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  evaluationMode === "open"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {language === "ja" ? "オープン" : "Open"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "ja"
                    ? "革新性/実現可能性/社会的インパクト/チーム力/プレゼン"
                    : "Innovation/Feasibility/Impact/Team/Presentation"}
                </div>
              </button>
              <button
                onClick={() => setEvaluationMode("closed")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  evaluationMode === "closed"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {language === "ja" ? "クローズド" : "Closed"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === "ja"
                    ? "金銭/家事/決定力/協力/ストレス軽減"
                    : "Money/Housework/Decision/Cooperation/Stress Relief"}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {language === "ja" ? "キャンセル" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === "ja" ? "作成" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
