import { ScrollArea } from "@/components/ui/scroll-area";
import ProposalCard from "./ProposalCard";
import CommentItem from "./CommentItem";
import AIResponseItem from "./AIResponseItem";
import ReactionBar from "./ReactionBar";

const ActionFeed = ({ items, activeSpace, onReaction, onProposalToProject }) => {
  // Filter items for active space, EXCLUDE EVALUATION (only shown during commit moment)
  const feedItems = items.filter(
    (item) => item.space === activeSpace && item.type !== "EVALUATION"
  );

  // Group reactions by targetId
  const reactionsByTarget = {};
  feedItems.forEach((item) => {
    if (item.type === "REACTION") {
      if (!reactionsByTarget[item.targetId]) {
        reactionsByTarget[item.targetId] = [];
      }
      reactionsByTarget[item.targetId].push(item);
    }
  });

  // Get comments for a target
  const getComments = (targetId) => {
    return feedItems.filter((item) => item.type === "COMMENT" && item.targetId === targetId);
  };

  // Get AI responses for a target
  const getAIResponses = (targetId) => {
    return feedItems.filter((item) => item.type === "AI_RESPONSE" && item.targetId === targetId);
  };

  // Only show proposals
  const proposals = feedItems.filter((item) => item.type === "PROPOSAL");

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-12 px-6 flex items-center border-b border-border bg-surface">
        <h2 className="text-sm font-medium text-text-primary">Action Feed</h2>
        <div className="ml-auto text-xs text-text-tertiary">{activeSpace}</div>
      </div>
      
      {/* Feed */}
      <ScrollArea className="flex-1 minimal-scrollbar">
        <div className="p-6 space-y-6">
          {proposals.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary text-sm">
              No proposals yet. Create one to get started.
            </div>
          ) : (
            proposals.map((proposal) => (
              <div key={proposal.id} className="space-y-3 animate-float-in">
                {/* Proposal Card */}
                <ProposalCard 
                  proposal={proposal}
                  onProposalToProject={onProposalToProject}
                />
                
                {/* Reactions */}
                {reactionsByTarget[proposal.id] && (
                  <ReactionBar 
                    reactions={reactionsByTarget[proposal.id]}
                    targetId={proposal.id}
                    onReaction={onReaction}
                  />
                )}
                
                {/* Comments */}
                {getComments(proposal.id).map((comment) => (
                  <div key={comment.id}>
                    <CommentItem comment={comment} />
                    
                    {/* AI Response after comment */}
                    {getAIResponses(comment.id).map((aiResponse) => (
                      <AIResponseItem key={aiResponse.id} response={aiResponse} />
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActionFeed;