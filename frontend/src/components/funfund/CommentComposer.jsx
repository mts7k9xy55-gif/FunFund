import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EMOTIONS = [
  { emoji: "😊", label: "嬉しい" },
  { emoji: "🤔", label: "考え中" },
  { emoji: "👍", label: "賛成" },
  { emoji: "😮", label: "驚き" },
  { emoji: "😢", label: "悲しい" },
];

const CommentComposer = ({ onSubmit, activeDiscussion }) => {
  const [content, setContent] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [showEmotions, setShowEmotions] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSubmit = () => {
    if (!content.trim()) return;

    const newComment = {
      type: "COMMENT",
      author: "You",
      content: content + (selectedEmotion ? ` ${selectedEmotion}` : ""),
      discussion: activeDiscussion,
      targetId: "1" // Mock: should target selected proposal
    };

    onSubmit(newComment);
    setContent("");
    setSelectedEmotion(null);
    setShowEmotions(false);
  };

  const handleKeyDown = (e) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Enter alone = new line (default behavior)
  };

  return (
    <div className="border-t border-border bg-surface">
      <div className="px-6 py-4 space-y-3">
        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="コメントを入力... (Cmd+Enter で送信)"
            className="min-h-[80px] max-h-[200px] resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between">
          {/* Emotion selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmotions(!showEmotions)}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              感情を添える {selectedEmotion || ""}
            </button>
            {showEmotions && (
              <div className="flex gap-1">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion.emoji}
                    onClick={() => {
                      setSelectedEmotion(emotion.emoji);
                      setShowEmotions(false);
                    }}
                    className="p-1 hover:bg-surface-hover rounded transition-colors"
                    title={emotion.label}
                  >
                    {emotion.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            size="sm"
            className="gap-1"
          >
            <Send className="h-3 w-3" />
            送信
          </Button>
        </div>

        {/* Helper text */}
        <div className="text-xs text-text-tertiary">
          <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Enter</kbd> で改行 ·{" "}
          <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Cmd+Enter</kbd> で送信
        </div>
      </div>
    </div>
  );
};

export default CommentComposer;