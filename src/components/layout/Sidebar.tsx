// src/components/layout/Sidebar.tsx
// Emergent風サイドバー：白基調 / 余白 / 角丸
// ロジックはそのまま維持

// Mock data (temporary, will be moved to a higher-level component)
const MOCK_SPACES = [
  { id: "1", name: "General", emoji: "💬" },
  { id: "2", name: "Proposals", emoji: "💡" },
  { id: "3", name: "Decisions", emoji: "⚖️" },
];

type Space = (typeof MOCK_SPACES)[0];

export default function Sidebar({
  spaces,
  selectedSpace,
  onSelectSpace,
}: {
  spaces: Space[];
  selectedSpace: string;
  onSelectSpace: (id: string) => void;
}) {
  return (
    <div className="w-56 bg-card border-r border-border flex flex-col shrink-0">
      {/* Spaces Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-muted-fg uppercase tracking-wider mb-2 px-2">
          Spaces
        </div>
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => onSelectSpace(space.id)}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm font-medium transition-colors ${
              selectedSpace === space.id
                ? "bg-primary/10 text-primary"
                : "text-muted-fg hover:bg-muted hover:text-fg"
            }`}
          >
            <span className="mr-2">{space.emoji}</span>
            {space.name}
          </button>
        ))}
      </div>
    </div>
  );
}
