import { useState, useRef, useEffect } from "react";
import { Send, Image, Paperclip, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CommentComposer = ({ onSubmit, language }) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  const handleSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;

    onSubmit({
      type: "COMMENT",
      author: "You",
      content,
      attachments: attachments.map(a => ({
        type: a.type,
        name: a.name,
        url: a.preview // In real app, would upload to server
      }))
    });

    setContent("");
    setAttachments([]);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (type === "image" && !file.type.startsWith("image/")) {
        toast.error(language === "ja" ? "画像ファイルを選択してください" : "Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments(prev => [...prev, {
          type: file.type.startsWith("image/") ? "image" : "file",
          name: file.name,
          preview: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            {attachments.map((attachment, idx) => (
              <div key={idx} className="relative group">
                {attachment.type === "image" ? (
                  <div className="relative">
                    <img 
                      src={attachment.preview} 
                      alt={attachment.name}
                      className="h-24 w-24 object-cover rounded border border-border"
                    />
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="relative px-3 py-2 bg-surface border border-border rounded flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">{attachment.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-destructive hover:text-destructive/80 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === "ja" ? "コメントを入力... (Cmd+Enterで送信)" : "Write a comment... (Cmd+Enter to send)"}
              className="min-h-[100px] max-h-[300px] resize-none text-base leading-relaxed"
            />
            
            {/* Media Buttons */}
            <div className="flex gap-2 mt-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "image")}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, "file")}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="text-sm"
              >
                <Image className="h-4 w-4 mr-1" />
                {language === "ja" ? "画像" : "Image"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                {language === "ja" ? "ファイル" : "File"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info(language === "ja" ? "プレゼンテーション機能は間もなく追加されます" : "Presentation feature coming soon")}
                className="text-sm"
              >
                <Video className="h-4 w-4 mr-1" />
                {language === "ja" ? "プレゼン" : "Present"}
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() && attachments.length === 0}
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