// src/components/composer/ItemComposer.tsx
// Emergent型Composer：下部固定 / コメント・評価・プロジェクト作成の切り替え

import { useState, useRef } from "react";

type ComposerMode = "comment" | "evaluation" | "project";

export default function ItemComposer({
  language,
  onSubmit,
  onOpenProjectCreate,
  disabled,
  reasonRequired,
}: {
  language: "ja" | "en";
  onSubmit?: (content: string, mode: ComposerMode, reason?: string, attachments?: { type: "image" | "file"; file: File }[]) => void;
  onOpenProjectCreate?: () => void;
  disabled?: boolean;
  reasonRequired?: boolean;
}) {
  const [content, setContent] = useState("");
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<{ type: "image" | "file"; file: File; preview?: string }[]>([]);
  const [mode, setMode] = useState<ComposerMode>("comment");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // よく使う絵文字リスト
  const commonEmojis = [
    "👍", "👎", "❤️", "🔥", "👏", "🎉", "😊", "😂",
    "🤔", "💡", "✅", "❌", "⭐", "🚀", "💪", "🙏",
    "👀", "💯", "🎯", "📌", "📝", "💬", "🤝", "⚡",
  ];

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;
    
    // 提言/プロジェクトの場合は理由を渡す
    const reasonToSubmit = (mode === "evaluation" || mode === "project") ? reason : undefined;
    
    onSubmit?.(content, mode, reasonToSubmit, attachments.map((a) => ({ type: a.type, file: a.file })));
    setContent("");
    setReason("");
    setAttachments([]);
    setMode("comment"); // 送信後はコメントモードに戻す
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) => [
            ...prev,
            { type: "image", file, preview: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    // リセット（同じファイルを選択できるように）
    e.target.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      setAttachments((prev) => [...prev, { type: "file", file }]);
    });
    
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // プレースホルダーをモードに応じて変更
  const getPlaceholder = () => {
    if (mode === "evaluation") {
      return language === "ja"
        ? "提言・意見を入力... (Cmd+Enterで送信)"
        : "Enter your proposal... (Cmd+Enter to send)";
    }
    if (mode === "project") {
      return language === "ja"
        ? "プロジェクトの説明を入力... (Cmd+Enterで送信)"
        : "Enter project description... (Cmd+Enter to send)";
    }
    return language === "ja"
      ? "コメントを入力... (Cmd+Enterで送信)"
      : "Enter comment... (Cmd+Enter to send)";
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto">
        {/* モード切り替え：コメント・提言・プロジェクト作成（上に配置） */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode("comment")}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "comment"
                ? "bg-primary text-primary-fg"
                : "bg-muted text-fg hover:bg-muted/80"
            }`}
          >
            {language === "ja" ? "コメント" : "Comment"}
          </button>
          <button
            type="button"
            onClick={() => setMode("evaluation")}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "evaluation"
                ? "bg-amber-500 text-white"
                : "bg-muted text-fg hover:bg-muted/80"
            }`}
          >
            {language === "ja" ? "提言" : "Proposal"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("project");
              onOpenProjectCreate?.();
            }}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "project"
                ? "bg-green-500 text-white"
                : "bg-muted text-fg hover:bg-muted/80"
            }`}
          >
            {language === "ja" ? "プロジェクト" : "Project"}
          </button>
        </div>

        {/* 添付ファイルプレビュー */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att, index) => (
              <div key={index} className="relative">
                {att.type === "image" && att.preview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={att.preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-muted border border-border text-xs text-fg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {att.file.name}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-muted-fg hover:text-fg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 理由入力欄（提言/プロジェクトの場合） */}
        {(mode === "evaluation" || mode === "project") && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-fg mb-2">
              {language === "ja" ? "理由（必須）" : "Reason (required)"} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === "ja" ? "理由を入力してください..." : "Enter your reason..."}
              disabled={disabled}
              className="w-full p-3 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>
        )}

        {/* 入力行：テキスト＋送信ボタン（紙飛行機） */}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className="flex-1 min-h-[44px] max-h-32 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-fg placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || (!content.trim() && attachments.length === 0) || ((mode === "evaluation" || mode === "project") && !reason.trim())}
            className="shrink-0 w-11 h-11 rounded-lg btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            aria-label={language === "ja" ? "送信" : "Send"}
          >
            <svg
              className="w-5 h-5 text-primary-fg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        {/* 隠しファイル入力 */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 添付オプション：絵文字・画像・ファイル（すべてのモードで使用可能） */}
        <div className="flex items-center gap-4 mt-3 relative">
          {/* 絵文字ボタン */}
          <div className="relative">
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
              <span className="text-base">😊</span>
              {language === "ja" ? "絵文字" : "Emoji"}
            </button>
            {/* 絵文字ピッカー */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-2 bg-card border border-border rounded-xl shadow-lg z-10">
                <div className="grid grid-cols-8 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleImageClick}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
            {language === "ja" ? "画像" : "Image"}
          </button>
          <button
            type="button"
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm text-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleFileClick}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {language === "ja" ? "ファイル" : "File"}
          </button>
        </div>
      </div>
    </div>
  );
}
