import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ReplyForm = ({ onSubmit, onCancel, language }) => {
  const [content, setContent] = useState("");

  return (
    <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={language === "ja" ? "返信を入力..." : "Write a reply..."}
        className="min-h-[80px] text-base mb-3"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => onSubmit(content)}
          disabled={!content.trim()}
          size="sm"
        >
          {language === "ja" ? "送信" : "Send"}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          {language === "ja" ? "キャンセル" : "Cancel"}
        </Button>
      </div>
    </div>
  );
};

export default ReplyForm;