// src/components/project/CreateProjectModal.tsx
// プロジェクト作成モーダル

"use client";

import { useState } from "react";

export default function CreateProjectModal({
  isOpen,
  onClose,
  language,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  language: "ja" | "en";
  type: "dm" | "thread";
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    // TODO: Convex mutation を呼び出す
    console.log("Project created:", { name, description, type });
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

  const title = language === "ja" ? "プロジェクトを作成" : "Create Project";
  const nameLabel = language === "ja" ? "プロジェクト名" : "Project Name";
  const namePlaceholder = language === "ja" ? "例: 新機能開発" : "e.g. New Feature Development";
  const descLabel = language === "ja" ? "説明（任意）" : "Description (optional)";
  const descPlaceholder = language === "ja" ? "プロジェクトの目的や概要..." : "Purpose and overview of the project...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
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
              {nameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              {descLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descPlaceholder}
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
