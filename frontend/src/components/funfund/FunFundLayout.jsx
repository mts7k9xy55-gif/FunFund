import { useState } from "react";
import LeftNav from "./LeftNav";
import ActionFeed from "./ActionFeed";
import UnifiedComposer from "./UnifiedComposer";

const FunFundLayout = () => {
  const [activeSpace, setActiveSpace] = useState("general");
  const [items, setItems] = useState(MOCK_ITEMS);
  const [composerMode, setComposerMode] = useState("flow"); // flow | commit

  const handleAddItem = (newItem) => {
    setItems([...items, { ...newItem, id: Date.now().toString(), timestamp: new Date().toISOString() }]);
    setComposerMode("flow");
  };

  const handleReaction = (itemId, reactionType) => {
    const reaction = {
      id: Date.now().toString(),
      type: "REACTION",
      targetId: itemId,
      reactionType,
      author: "You",
      timestamp: new Date().toISOString()
    };
    setItems([...items, reaction]);
  };

  const handleProposalToProject = (proposalId) => {
    // Mock: Create project from proposal
    console.log("Convert proposal to project:", proposalId);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content - 2 Panes (removed right ledger) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <LeftNav 
          activeSpace={activeSpace}
          setActiveSpace={setActiveSpace}
        />
        
        {/* Center Feed (now full width without right pane) */}
        <ActionFeed 
          items={items}
          activeSpace={activeSpace}
          onReaction={handleReaction}
          onProposalToProject={handleProposalToProject}
        />
      </div>
      
      {/* Bottom Composer */}
      <UnifiedComposer 
        mode={composerMode}
        setMode={setComposerMode}
        onSubmit={handleAddItem}
        activeSpace={activeSpace}
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
    content: "Build a decentralized funding platform for open source projects",
    title: "Open Source Fund",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    space: "general",
    tags: ["platform", "open-source"]
  },
  {
    id: "2",
    type: "COMMENT",
    author: "Bob",
    content: "This could work well with quadratic funding mechanisms",
    targetId: "1",
    timestamp: new Date(Date.now() - 6800000).toISOString(),
    space: "general"
  },
  {
    id: "3",
    type: "REACTION",
    author: "Carol",
    targetId: "1",
    reactionType: "agree",
    timestamp: new Date(Date.now() - 6600000).toISOString(),
    space: "general"
  },
  {
    id: "4",
    type: "AI_RESPONSE",
    author: "AI Assistant",
    content: "Quadratic funding has been successfully implemented in Gitcoin Grants. Key considerations: Sybil resistance, matching pool management, and transparent governance.",
    targetId: "2",
    timestamp: new Date(Date.now() - 6400000).toISOString(),
    space: "general"
  },
  {
    id: "5",
    type: "EVALUATION",
    author: "David",
    targetId: "1",
    vote: "positive",
    stake: 100,
    comment: "Strong technical foundation and clear market need",
    timestamp: new Date(Date.now() - 6000000).toISOString(),
    space: "general"
  },
  {
    id: "6",
    type: "PROPOSAL",
    author: "Eve",
    content: "Create educational content series on Web3 fundamentals",
    title: "Web3 Education Hub",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    space: "general",
    tags: ["education", "content"]
  }
];