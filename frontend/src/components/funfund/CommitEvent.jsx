import { Award } from "lucide-react";

const CommitEvent = ({ evaluation, showTarget = false }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative pl-6 py-4 border-l-2 border-yellow-400 bg-commit/30 rounded-r-lg animate-float-in">
      {/* Event marker */}
      <div className="absolute left-0 top-4 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
        <Award className="h-2.5 w-2.5 text-yellow-900" />
      </div>
      
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{evaluation.author}</span>
            <span className="text-xs text-text-tertiary">committed</span>
          </div>
          <div className="text-xs text-text-tertiary">{formatTime(evaluation.timestamp)}</div>
        </div>
        
        {/* Vote & Stake */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold ${
              evaluation.vote === "positive"
                ? "bg-green-100 text-green-700"
                : evaluation.vote === "neutral"
                ? "bg-gray-100 text-gray-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {evaluation.vote === "positive" ? "✓" : evaluation.vote === "neutral" ? "○" : "✗"}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {evaluation.stake} stake
          </span>
        </div>
        
        {/* Comment */}
        {evaluation.comment && (
          <p className="text-sm text-text-secondary leading-relaxed">
            {evaluation.comment}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommitEvent;