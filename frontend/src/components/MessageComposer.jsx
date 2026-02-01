import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, AtSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const MessageComposer = ({ onSend, channelName }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setSendFailed(false);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Simulate random failure (10% chance for demo)
      if (Math.random() < 0.1) {
        throw new Error("Failed to send message");
      }

      onSend(message);
      setMessage("");
      toast.success("Message sent!");
    } catch (error) {
      setSendFailed(true);
      toast.error("Failed to send message", {
        description: "Click retry to send again",
        action: {
          label: "Retry",
          onClick: () => handleSend(),
        },
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter creates new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex items-end gap-2 bg-card border border-input rounded-lg p-2">
        {/* Textarea */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}`}
            className="min-h-[40px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-2"
            disabled={isSending}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 pb-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toast.info("Attach file feature")}
            disabled={isSending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toast.info("Add emoji feature")}
            disabled={isSending}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toast.info("Mention user feature")}
            disabled={isSending}
          >
            <AtSign className="h-4 w-4" />
          </Button>
          
          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            size="icon"
            className={cn(
              "h-8 w-8 transition-smooth",
              sendFailed && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground px-2">
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Enter</kbd>
        {" "}to send,{" "}
        <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Shift + Enter</kbd>
        {" "}for new line
      </p>

      {/* Sending Indicator */}
      {isSending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
          <div className="flex gap-1">
            <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full"></span>
            <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full"></span>
            <span className="typing-dot w-1.5 h-1.5 bg-primary rounded-full"></span>
          </div>
          <span>Sending message...</span>
        </div>
      )}

      {/* Failed Indicator */}
      {sendFailed && (
        <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-lg p-2 px-3">
          <p className="text-xs text-destructive font-medium">
            Failed to send message
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSend}
            className="h-7 text-xs border-destructive/20 hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};

export default MessageComposer;