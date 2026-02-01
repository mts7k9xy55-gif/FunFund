import { ScrollArea } from "@/components/ui/scroll-area";
import { Award } from "lucide-react";

const CommitLedger = ({ items, activeSpace }) => {
  // Get evaluations for active space
  const evaluations = items.filter(
    (item) => item.space === activeSpace && item.type === "EVALUATION"
  );

  // Get proposal title for evaluation
  const getProposalTitle = (targetId) => {
    const proposal = items.find((item) => item.id === targetId && item.type === "PROPOSAL");
    return proposal?.title || "Unknown Proposal";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-80 border-l border-border flex flex-col bg-commit">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border">
        <Award className="h-4 w-4 text-text-tertiary mr-2" />
        <h2 className="text-sm font-medium text-text-primary">Commit Ledger</h2>
      </div>
      
      {/* Evaluations */}
      <ScrollArea className="flex-1 minimal-scrollbar">
        <div className="p-4 space-y-3">
          {evaluations.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary text-xs">
              No evaluations yet
            </div>
          ) : (
            evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="border border-border-strong rounded-lg p-3 bg-background animate-float-in"
              >
                {/* Author & Time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-text-primary">
                    {evaluation.author}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {formatTime(evaluation.timestamp)}
                  </div>
                </div>
                
                {/* Target Proposal */}
                <div className="text-xs text-text-secondary mb-2">
                  → {getProposalTitle(evaluation.targetId)}
                </div>
                
                {/* Vote & Stake */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      evaluation.vote === "positive"
                        ? "bg-green-100 text-green-700"
                        : evaluation.vote === "neutral"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {evaluation.vote === "positive" ? "✓" : evaluation.vote === "neutral" ? "○" : "✗"}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {evaluation.stake} stake
                  </span>
                </div>
                
                {/* Comment */}
                {evaluation.comment && (
                  <div className="text-xs text-text-secondary leading-relaxed">
                    {evaluation.comment}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommitLedger;