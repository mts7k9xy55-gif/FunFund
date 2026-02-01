import { MessageSquare, FolderKanban } from "lucide-react";

const MOCK_DISCUSSIONS = [
  { id: "general", name: "全体議論", nameEn: "General" },
  { id: "design", name: "デザイン", nameEn: "Design" },
  { id: "tech", name: "技術", nameEn: "Technology" },
];

const MOCK_PROJECTS = [
  { id: "p1", name: "UIリニューアルv2" },
  { id: "p2", name: "ドキュメント整備" },
];

const LeftNav = ({ activeCommunity, activeDiscussion, setActiveDiscussion }) => {
  return (
    <div className="w-48 border-r border-border flex flex-col bg-surface">
      {/* Discussions */}
      <div className="flex-1 overflow-auto minimal-scrollbar">
        <div className="p-3 space-y-1">
          <div className="text-xs font-medium text-text-tertiary px-2 mb-2">議論</div>
          {MOCK_DISCUSSIONS.map((discussion) => (
            <button
              key={discussion.id}
              onClick={() => setActiveDiscussion(discussion.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                activeDiscussion === discussion.id
                  ? "bg-accent-light text-accent font-medium"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{discussion.name}</span>
            </button>
          ))}
        </div>
        
        {/* Projects */}
        <div className="p-3 space-y-1 border-t border-border mt-2">
          <div className="text-xs font-medium text-text-tertiary px-2 mb-2">プロジェクト</div>
          {MOCK_PROJECTS.map((project) => (
            <button
              key={project.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="flex-1 truncate text-left">{project.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftNav;