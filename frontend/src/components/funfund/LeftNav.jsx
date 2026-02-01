import { FolderKanban, Plus, ChevronRight } from "lucide-react";

const MOCK_SPACES = [
  { id: "general", name: "general", type: "space" },
  { id: "tech", name: "tech", type: "space" },
  { id: "design", name: "design", type: "space" },
];

const MOCK_PROJECTS = [
  { id: "p1", name: "Open Source Fund", activeProposals: 3 },
  { id: "p2", name: "Web3 Education Hub", activeProposals: 1 },
];

const LeftNav = ({ activeSpace, setActiveSpace }) => {
  return (
    <div className="w-56 border-r border-border flex flex-col bg-surface">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border">
        <h1 className="text-sm font-semibold text-text-primary">FunFund</h1>
      </div>
      
      {/* Spaces */}
      <div className="flex-1 overflow-auto minimal-scrollbar">
        <div className="p-3 space-y-1">
          <div className="text-xs font-medium text-text-tertiary px-2 mb-2">Spaces</div>
          {MOCK_SPACES.map((space) => (
            <button
              key={space.id}
              onClick={() => setActiveSpace(space.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                activeSpace === space.id
                  ? "bg-accent-light text-accent font-medium"
                  : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <span>{space.name}</span>
            </button>
          ))}
        </div>
        
        {/* Projects */}
        <div className="p-3 space-y-1 border-t border-border mt-2">
          <div className="text-xs font-medium text-text-tertiary px-2 mb-2 flex items-center justify-between">
            <span>Projects</span>
            <Plus className="h-3 w-3" />
          </div>
          {MOCK_PROJECTS.map((project) => (
            <button
              key={project.id}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="flex-1 truncate text-left">{project.name}</span>
              {project.activeProposals > 0 && (
                <span className="text-xs text-text-tertiary">{project.activeProposals}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftNav;