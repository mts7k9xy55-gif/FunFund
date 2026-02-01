import { useState } from "react";
import TopBar from "./TopBar";
import DiscussionFeed from "./DiscussionFeed";
import CommentComposer from "./CommentComposer";
import MenuDrawer from "./MenuDrawer";

const FunFundLayout = () => {
  const [items, setItems] = useState(MOCK_ITEMS);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSpace, setActiveSpace] = useState({ type: "public", id: "general" });
  const [language, setLanguage] = useState("ja");

  const handleAddItem = (newItem) => {
    const item = { 
      ...newItem, 
      id: Date.now().toString(), 
      timestamp: new Date().toISOString(),
      credibility: 75 // Mock credibility score
    };
    setItems([...items, item]);
  };

  const handleEvaluate = (targetId, evaluation) => {
    const evaluationItem = {
      id: Date.now().toString(),
      type: "EVALUATION",
      targetId,
      author: "You",
      vote: evaluation.vote,
      stake: evaluation.stake,
      reasoning: evaluation.reasoning,
      timestamp: new Date().toISOString(),
      credibility: 75
    };
    setItems([...items, evaluationItem]);
  };

  const handleReply = (targetId, content) => {
    const reply = {
      id: Date.now().toString(),
      type: "COMMENT",
      targetId,
      author: "You",
      content,
      timestamp: new Date().toISOString(),
      credibility: 75
    };
    setItems([...items, reply]);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <TopBar 
        onMenuClick={() => setShowMenu(true)}
        activeSpace={activeSpace}
        language={language}
      />

      {/* Main Feed - Full Width */}
      <div className="flex-1 overflow-hidden">
        <DiscussionFeed 
          items={items}
          onEvaluate={handleEvaluate}
          onReply={handleReply}
          language={language}
        />
      </div>
      
      {/* Bottom Composer */}
      <CommentComposer 
        onSubmit={handleAddItem}
        language={language}
      />

      {/* Menu Drawer */}
      <MenuDrawer
        show={showMenu}
        onClose={() => setShowMenu(false)}
        activeSpace={activeSpace}
        setActiveSpace={setActiveSpace}
        language={language}
        setLanguage={setLanguage}
      />
    </div>
  );
};

export default FunFundLayout;

// Mock data with credibility scores
const MOCK_ITEMS = [
  {
    id: "1",
    type: "PROPOSAL",
    author: "Alice",
    content: "UIデザイン原則を明文化し、チーム全体で共有する仕組みを作りたい。デザインシステムのドキュメントとして整備し、一貫性のある開発を実現する。",
    title: "UIデザイン原則の策定",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    credibility: 85
  },
  {
    id: "2",
    type: "COMMENT",
    author: "Bob",
    content: "デザイントークンの整備から始めるのが良いと思います。色、タイポグラフィ、スペーシングの3つを優先的に。",
    targetId: "1",
    timestamp: new Date(Date.now() - 6800000).toISOString(),
    credibility: 78
  },
  {
    id: "3",
    type: "EVALUATION",
    author: "Carol",
    targetId: "1",
    vote: "positive",
    stake: 100,
    reasoning: "技術的に実現可能で、チームの生産性向上に貢献する重要な提案です。",
    timestamp: new Date(Date.now() - 6600000).toISOString(),
    credibility: 92
  },
  {
    id: "4",
    type: "EVALUATION",
    author: "David",
    targetId: "3",
    vote: "positive",
    stake: 50,
    reasoning: "Carolの判断に同意します。実績からも信頼できる評価だと考えます。",
    timestamp: new Date(Date.now() - 6400000).toISOString(),
    credibility: 65
  }
];