const CommentItem = ({ comment }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="pl-4 py-2 border-l border-border ml-2 animate-float-in">
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xs font-medium text-text-secondary">{comment.author}</div>
        <div className="text-xs text-text-tertiary">{formatTime(comment.timestamp)}</div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>
    </div>
  );
};

export default CommentItem;