import { useState } from "react";
import { MoreVertical, Smile, Reply, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const Message = ({ message, onConvertToProject }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleConvertClick = () => {
    onConvertToProject(message.id);
    toast.success("Message converted to project!", {
      description: "A new project has been created from this message."
    });
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group px-6 py-2 hover:bg-message-hover transition-smooth relative",
        "message-enter"
      )}
    >
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
        </div>
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="absolute top-0 right-4 -translate-y-1/2 bg-card border border-border rounded-lg shadow-md flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-secondary"
            onClick={() => toast.info("Add reaction feature")}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-secondary"
            onClick={() => toast.info("Reply feature")}
          >
            <Reply className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-secondary"
            onClick={handleConvertClick}
            title="Convert to Project"
          >
            <FolderKanban className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-secondary"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleConvertClick}>
                <FolderKanban className="mr-2 h-4 w-4" />
                Convert to Project
              </DropdownMenuItem>
              <DropdownMenuItem>Edit Message</DropdownMenuItem>
              <DropdownMenuItem>Copy Link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete Message
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export const MessageList = ({ messages, onConvertToProject }) => {
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
        <Message 
          key={message.id} 
          message={message} 
          onConvertToProject={onConvertToProject}
        />
      ))}
    </div>
  );
};

export default MessageList;