// src/components/room/CreateRoomModal.tsx
// Room作成モーダル

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, mode: "open" | "closed") => void;
  language?: "ja" | "en";
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onSubmit,
  language = "ja",
}: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"open" | "closed">("open");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSubmit(name.trim(), mode);
    setName("");
    setMode("open");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setMode("open");
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl">
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

          {/* Roomタイプ（2択） */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "ja" ? "Roomタイプ" : "Room Type"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("open")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  mode === "open"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <div className="text-sm font-semibold">{language === "ja" ? "オープン" : "Open"}</div>
              </button>
              <button
                onClick={() => setMode("closed")}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  mode === "closed"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <div className="text-sm font-semibold">
                  {language === "ja" ? "プライベート" : "Private"}
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

  return createPortal(modalContent, document.body);
}
