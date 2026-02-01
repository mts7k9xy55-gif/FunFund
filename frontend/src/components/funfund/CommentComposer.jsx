import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CommentComposer = ({ onSubmit, language }) => {
  const [content, setContent] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      type: "COMMENT",
      author: "You",
      content
    });

    setContent("");
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === "ja" ? "コメントを入力... (Cmd+Enterで送信)" : "Write a comment... (Cmd+Enter to send)"}
            className="min-h-[100px] max-h-[300px] resize-none text-base leading-relaxed"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            size="icon"
            className="h-12 w-12 flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-sm text-text-tertiary mt-2">
          <kbd className="px-2 py-1 bg-surface border border-border rounded">Enter</kbd>
          {language === "ja" ? " で改行 · " : " for new line · "}
          <kbd className="px-2 py-1 bg-surface border border-border rounded">Cmd+Enter</kbd>
          {language === "ja" ? " で送信" : " to send"}
        </div>
      </div>
    </div>
  );
};

export default CommentComposer;