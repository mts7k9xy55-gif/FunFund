import { ArrowRight } from "lucide-react";

const ProposalCard = ({ proposal, onProposalToProject }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-do border border-border-strong rounded-lg p-5 hover:shadow-card transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs font-medium text-text-primary">{proposal.author}</div>
            <div className="text-xs text-text-tertiary">{formatTime(proposal.timestamp)}</div>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{proposal.title}</h3>
        </div>
        <button
          onClick={() => onProposalToProject(proposal.id)}
          className="p-1.5 hover:bg-surface rounded transition-colors"
          title="Convert to Project"
        >
          <ArrowRight className="h-4 w-4 text-text-tertiary" />
        </button>
      </div>
      
      {/* Content */}
      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        {proposal.content}
      </p>
      
      {/* Tags */}
      {proposal.tags && proposal.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {proposal.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-surface border border-border rounded text-xs text-text-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalCard;