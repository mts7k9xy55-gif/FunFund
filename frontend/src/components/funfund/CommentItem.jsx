import { useState } from "react";
import { ArrowUp } from "lucide-react";

const CommentItem = ({ comment, onPromoteToProposal }) => {
  const [showPromote, setShowPromote] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div 
      className="pl-4 py-2 border-l border-border ml-2 animate-float-in relative group"
      onMouseEnter={() => setShowPromote(true)}
      onMouseLeave={() => setShowPromote(false)}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xs font-medium text-text-secondary">{comment.author}</div>
        <div className="text-xs text-text-tertiary">{formatTime(comment.timestamp)}</div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>
      
      {/* Promote button */}
      {showPromote && (
        <button
          onClick={() => onPromoteToProposal(comment.id)}
          className="absolute right-2 top-2 px-2 py-1 text-xs bg-accent-light text-accent hover:bg-accent hover:text-white rounded transition-colors flex items-center gap-1"
        >
          <ArrowUp className="h-3 w-3" />
          議題にする
        </button>
      )}
    </div>
  );
};

export default CommentItem;