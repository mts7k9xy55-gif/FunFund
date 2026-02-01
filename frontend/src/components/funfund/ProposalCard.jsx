import { Button } from "@/components/ui/button";
import { MessageSquare, Award } from "lucide-react";

const ProposalCard = ({ proposal, onSelectProposal, isSelected }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}時間前`;
    }
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  return (
    <div className={`bg-card border rounded-lg p-5 transition-all ${
      isSelected 
        ? "border-accent shadow-md" 
        : "border-border-strong hover:shadow-sm"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs font-medium text-text-secondary">{proposal.author}</div>
            <div className="text-xs text-text-tertiary">{formatTime(proposal.timestamp)}</div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{proposal.title}</h3>
        </div>
      </div>
      
      {/* Content */}
      <p className="text-sm text-text-secondary leading-relaxed mb-4">
        {proposal.content}
      </p>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          議論する
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onSelectProposal(proposal.id)}
        >
          <Award className="h-3 w-3 mr-1" />
          判断する
        </Button>
      </div>
    </div>
  );
};

export default ProposalCard;