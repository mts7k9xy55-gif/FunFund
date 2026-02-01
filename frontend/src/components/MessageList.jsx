import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FolderKanban } from "lucide-react";
import { toast } from "sonner";

const MessageList = ({ messages, onConvertToProject }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {messages.map((message) => (
        <div key={message.id} className="group px-6 py-2 hover:bg-message-hover transition-smooth relative">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                {message.avatar}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground">
                  {message.user}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              
              <div className="text-sm text-foreground leading-relaxed">
                {message.content}
              </div>
              
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {message.reactions.map((reaction, idx) => (
                    <button
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary-hover border border-border text-xs transition-smooth"
                    >
                      <span>{reaction.emoji}</span>
                      <span className="text-muted-foreground font-medium">
                        {reaction.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-smooth">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    onConvertToProject(message.id);
                    toast.success("Converted to project!");
                  }}
                >
                  <FolderKanban className="h-3 w-3 mr-1" />
                  Convert to Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
