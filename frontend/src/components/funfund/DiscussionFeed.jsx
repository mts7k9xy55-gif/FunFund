import { ScrollArea } from "@/components/ui/scroll-area";
import ProposalCard from "./ProposalCard";
import CommentItem from "./CommentItem";
import AIResponseItem from "./AIResponseItem";
import EvaluationRecordItem from "./EvaluationRecordItem";

const DiscussionFeed = ({ 
  items, 
  activeDiscussion, 
  onPromoteToProposal,
  onSelectProposal,
  selectedProposal
}) => {
  // Filter items for active discussion
  const feedItems = items.filter(
    (item) => item.discussion === activeDiscussion
  );

  // Get comments for a target
  const getComments = (targetId) => {
    return feedItems.filter((item) => item.type === "COMMENT" && item.targetId === targetId);
  };

  // Get AI responses for a target
  const getAIResponses = (targetId) => {
    return feedItems.filter((item) => item.type === "AI_RESPONSE" && item.targetId === targetId);
  };

  // Get evaluation records for a target
  const getEvaluationRecords = (targetId) => {
    return feedItems.filter((item) => item.type === "EVALUATION_RECORD" && item.targetId === targetId);
  };

  // Only show proposals and their associated items
  const proposals = feedItems.filter((item) => item.type === "PROPOSAL");

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-12 px-6 flex items-center border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-text-primary">議論フィード</h2>
      </div>
      
      {/* Feed */}
      <ScrollArea className="flex-1 minimal-scrollbar">
        <div className="p-6 space-y-8">
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary text-sm">
              議題がありません。コメントから議題を作成してください。
            </div>
          ) : (
            proposals.map((proposal) => (
              <div key={proposal.id} className="space-y-3 animate-float-in">
                {/* Proposal Card */}
                <ProposalCard 
                  proposal={proposal}
                  onSelectProposal={onSelectProposal}
                  isSelected={selectedProposal === proposal.id}
                />
                
                {/* Comments */}
                {getComments(proposal.id).map((comment) => (
                  <div key={comment.id}>
                    <CommentItem 
                      comment={comment}
                      onPromoteToProposal={onPromoteToProposal}
                    />
                    
                    {/* AI Response after comment */}
                    {getAIResponses(comment.id).map((aiResponse) => (
                      <AIResponseItem key={aiResponse.id} response={aiResponse} />
                    ))}
                  </div>
                ))}
                
                {/* Evaluation Records */}
                {getEvaluationRecords(proposal.id).map((record) => (
                  <EvaluationRecordItem key={record.id} record={record} />
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DiscussionFeed;