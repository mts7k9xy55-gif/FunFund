// src/components/group/CreateGroupModal.tsx
// グループ作成モーダル

"use client";

import { useState } from "react";

export default function CreateGroupModal({
  isOpen,
  onClose,
  language,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  language: "ja" | "en";
  onSubmit?: (name: string, description: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSubmit?.(name, description);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setName("");
    setDescription("");
  };

  const handleClose = () => {
    handleReset();
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
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">
            {language === "ja" ? "グループを作成" : "Create Group"}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-fg hover:text-fg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              {language === "ja" ? "グループ名" : "Group Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "ja" ? "例: デザインチーム" : "e.g. Design Team"}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              {language === "ja" ? "説明（任意）" : "Description (optional)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === "ja" ? "グループの目的や活動内容..." : "Purpose and activities of the group..."}
              className="w-full p-3 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-card border border-border text-sm text-fg hover:bg-muted transition-colors"
          >
            {language === "ja" ? "キャンセル" : "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === "ja" ? "作成" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
