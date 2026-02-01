import { ScrollArea } from "@/components/ui/scroll-area";
import ProposalCard from "./ProposalCard";
import CommentItem from "./CommentItem";
import AIResponseItem from "./AIResponseItem";
import ReactionBar from "./ReactionBar";
import CommitEvent from "./CommitEvent";

const ActionFeed = ({ items, activeSpace, onReaction, onProposalToProject }) => {
  // Filter items for active space
  const feedItems = items.filter((item) => item.space === activeSpace);

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

  // Get evaluations for a target
  const getEvaluations = (targetId) => {
    return feedItems.filter((item) => item.type === "EVALUATION" && item.targetId === targetId);
  };

  // Render proposals and evaluations in chronological order
  const proposals = feedItems.filter((item) => item.type === "PROPOSAL");
  const evaluations = feedItems.filter((item) => item.type === "EVALUATION");

  // Merge and sort by timestamp
  const mainItems = [...proposals, ...evaluations].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

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
          {mainItems.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary text-sm">
              No activity yet. Create a proposal to get started.
            </div>
          ) : (
            mainItems.map((item) => (
              <div key={item.id}>
                {item.type === "PROPOSAL" ? (
                  <div className="space-y-3 animate-float-in">
                    {/* Proposal Card */}
                    <ProposalCard 
                      proposal={item}
                      onProposalToProject={onProposalToProject}
                    />
                    
                    {/* Reactions */}
                    {reactionsByTarget[item.id] && (
                      <ReactionBar 
                        reactions={reactionsByTarget[item.id]}
                        targetId={item.id}
                        onReaction={onReaction}
                      />
                    )}
                    
                    {/* Comments */}
                    {getComments(item.id).map((comment) => (
                      <div key={comment.id}>
                        <CommentItem comment={comment} />
                        
                        {/* AI Response after comment */}
                        {getAIResponses(comment.id).map((aiResponse) => (
                          <AIResponseItem key={aiResponse.id} response={aiResponse} />
                        ))}
                      </div>
                    ))}
                    
                    {/* Evaluations as events */}
                    {getEvaluations(item.id).map((evaluation) => (
                      <CommitEvent key={evaluation.id} evaluation={evaluation} />
                    ))}
                  </div>
                ) : item.type === "EVALUATION" ? (
                  <div className="animate-float-in">
                    <CommitEvent evaluation={item} showTarget />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActionFeed;