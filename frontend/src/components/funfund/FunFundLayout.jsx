import { useState } from "react";
import LeftNav from "./LeftNav";
import DiscussionFeed from "./DiscussionFeed";
import EvaluationPanel from "./EvaluationPanel";
import CommentComposer from "./CommentComposer";

const FunFundLayout = () => {
  const [activeCommunity, setActiveCommunity] = useState("design-thinking");
  const [activeDiscussion, setActiveDiscussion] = useState("general");
  const [items, setItems] = useState(MOCK_ITEMS);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showEvaluationPanel, setShowEvaluationPanel] = useState(false);

  const handleAddItem = (newItem) => {
    setItems([...items, { ...newItem, id: Date.now().toString(), timestamp: new Date().toISOString() }]);
  };

  const handlePromoteToProposal = (commentId) => {
    const comment = items.find(item => item.id === commentId);
    if (!comment) return;

    const proposal = {
      id: Date.now().toString(),
      type: "PROPOSAL",
      author: comment.author,
      title: comment.content.slice(0, 60) + (comment.content.length > 60 ? "..." : ""),
      content: comment.content,
      discussion: activeDiscussion,
      timestamp: new Date().toISOString(),
      promotedFrom: commentId
    };

    setItems([...items, proposal]);
  };

  const handleSelectProposal = (proposalId) => {
    setSelectedProposal(proposalId);
    setShowEvaluationPanel(true);
  };

  const handleEvaluationSubmit = async (evaluation) => {
    setShowEvaluationPanel(false);
    
    // Evaluation ceremony (handled in EvaluationPanel)
    // After ceremony, add evaluation item and record
    const evaluationItem = {
      ...evaluation,
      id: Date.now().toString(),
      type: "EVALUATION",
      timestamp: new Date().toISOString(),
      discussion: activeDiscussion
    };

    // Add evaluation record (1 line in feed)
    const record = {
      id: (Date.now() + 1).toString(),
      type: "EVALUATION_RECORD",
      author: evaluation.author,
      targetId: evaluation.targetId,
      timestamp: new Date().toISOString(),
      discussion: activeDiscussion
    };

    setItems([...items, evaluationItem, record]);
    setSelectedProposal(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-12 border-b border-border flex items-center px-6 bg-surface">
        <h1 className="text-sm font-semibold text-text-primary">FunFund</h1>
        <div className="ml-auto text-sm text-text-secondary">
          Community: {activeCommunity}
        </div>
      </div>

      {/* Main Content - 3 Panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <LeftNav 
          activeCommunity={activeCommunity}
          activeDiscussion={activeDiscussion}
          setActiveDiscussion={setActiveDiscussion}
        />
        
        {/* Center Feed */}
        <DiscussionFeed 
          items={items}
          activeDiscussion={activeDiscussion}
          onPromoteToProposal={handlePromoteToProposal}
          onSelectProposal={handleSelectProposal}
          selectedProposal={selectedProposal}
        />
        
        {/* Right Panel - Evaluation */}
        {showEvaluationPanel && selectedProposal && (
          <EvaluationPanel
            proposal={items.find(item => item.id === selectedProposal)}
            onSubmit={handleEvaluationSubmit}
            onClose={() => {
              setShowEvaluationPanel(false);
              setSelectedProposal(null);
            }}
          />
        )}
      </div>
      
      {/* Bottom Composer */}
      <CommentComposer 
        onSubmit={handleAddItem}
        activeDiscussion={activeDiscussion}
      />
    </div>
  );
};

export default FunFundLayout;

// Mock data
const MOCK_ITEMS = [
  {
    id: "1",
    type: "PROPOSAL",
    author: "Alice",
    content: "UIデザイン原則を明文化し、チーム全体で共有する仕組みを作りたい。デザインシステムのドキュメントとして整備し、一貫性のある開発を実現する。",
    title: "UIデザイン原則の策定",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    discussion: "general"
  },
  {
    id: "2",
    type: "COMMENT",
    author: "Bob",
    content: "デザイントークンの整備から始めるのが良いと思います。色、タイポグラフィ、スペーシングの3つを優先的に。",
    targetId: "1",
    timestamp: new Date(Date.now() - 6800000).toISOString(),
    discussion: "general"
  },
  {
    id: "3",
    type: "COMMENT",
    author: "Carol",
    content: "FigmaのVariablesを使えば、デザインとコードの一貫性を保ちやすくなります。",
    targetId: "1",
    timestamp: new Date(Date.now() - 6600000).toISOString(),
    discussion: "general"
  },
  {
    id: "4",
    type: "AI_RESPONSE",
    author: "AI",
    content: "デザイントークンの標準化は、Style DictionaryやTailwind CSS、CSS Variables（カスタムプロパティ）などのツールで実現できます。チームの技術スタックに合わせて選択すると良いでしょう。",
    targetId: "2",
    timestamp: new Date(Date.now() - 6400000).toISOString(),
    discussion: "general"
  },
  {
    id: "5",
    type: "EVALUATION_RECORD",
    author: "David",
    targetId: "1",
    timestamp: new Date(Date.now() - 6000000).toISOString(),
    discussion: "general"
  }
];