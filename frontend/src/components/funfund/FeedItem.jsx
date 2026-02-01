import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Award, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import EvaluationForm from "./EvaluationForm";
import ReplyForm from "./ReplyForm";

const FeedItem = ({ item, onEvaluate, onReply, language, depth = 0 }) => {
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}${language === "ja" ? "時間前" : "h ago"}`;
    }
    return date.toLocaleDateString(language === "ja" ? "ja-JP" : "en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const getCredibilityColor = (score) => {
    if (score >= 80) return "text-yellow-600";
    if (score >= 60) return "text-blue-600";
    return "text-gray-600";
  };

  const getVoteLabel = (vote) => {
    if (language === "ja") {
      return vote === "positive" ? "✓ 賛成" : vote === "neutral" ? "○ 中立" : "✗ 反対";
    }
    return vote === "positive" ? "✓ Positive" : vote === "neutral" ? "○ Neutral" : "✗ Negative";
  };

  const isEvaluation = item.type === "EVALUATION";
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="animate-float-in" style={{ marginLeft: `${depth * 32}px` }}>
      <div className={`rounded-lg border p-5 ${
        isEvaluation 
          ? "bg-yellow-50 border-yellow-200" 
          : "bg-card border-border hover:border-border-strong"
      } transition-colors`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-base font-semibold text-text-primary">
              {item.author}
            </div>
            <div className={`text-sm font-medium ${getCredibilityColor(item.credibility)}`}>
              {item.credibility}
            </div>
            <div className="text-sm text-text-tertiary">
              {formatTime(item.timestamp)}
            </div>
          </div>
          {hasChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Title (for proposals) */}
        {item.title && (
          <h3 className="text-xl font-bold text-text-primary mb-3">
            {item.title}
          </h3>
        )}

        {/* Content or Evaluation Details */}
        {isEvaluation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-text-primary">
                {getVoteLabel(item.vote)}
              </span>
              <span className="text-sm text-text-secondary">
                Stake: {item.stake}
              </span>
            </div>
            <p className="text-base text-text-secondary leading-relaxed">
              {item.reasoning}
            </p>
          </div>
        ) : (
          <>
            <p className="text-base text-text-primary leading-relaxed">
              {item.content}
            </p>
            
            {/* Attachments */}
            {item.attachments && item.attachments.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {item.attachments.map((attachment, idx) => (
                  <div key={idx}>
                    {attachment.type === "image" ? (
                      <img 
                        src={attachment.url} 
                        alt={attachment.name}
                        className="max-w-md max-h-96 rounded border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(attachment.url, "_blank")}
                      />
                    ) : (
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded hover:bg-surface-hover transition-colors"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm">{attachment.name}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-sm"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {language === "ja" ? "返信" : "Reply"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEvalForm(!showEvalForm)}
            className="text-sm"
          >
            <Award className="h-4 w-4 mr-1" />
            {language === "ja" ? "判断" : "Evaluate"}
          </Button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <ReplyForm
            onSubmit={(content) => {
              onReply(item.id, content);
              setShowReplyForm(false);
            }}
            onCancel={() => setShowReplyForm(false)}
            language={language}
          />
        )}

        {/* Evaluation Form */}
        {showEvalForm && (
          <EvaluationForm
            onSubmit={(evaluation) => {
              onEvaluate(item.id, evaluation);
              setShowEvalForm(false);
            }}
            onCancel={() => setShowEvalForm(false)}
            language={language}
          />
        )}
      </div>

      {/* Children (Fractal Structure) */}
      {expanded && hasChildren && (
        <div className="mt-3 space-y-3">
          {item.children.map((child) => (
            <FeedItem
              key={child.id}
              item={child}
              onEvaluate={onEvaluate}
              onReply={onReply}
              language={language}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedItem;