// src/components/layout/Sidebar.tsx
// This component displays a list of spaces for navigation.
// It receives the list of spaces, the currently selected space,
// and a function to handle space selection as props.
// It is a pure presentational component with no internal state or business logic.

import { useState } from "react";

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
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="p-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold">FunFund</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => onSelectSpace(space.id)}
            className={`w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
              selectedSpace === space.id
                ? "bg-neutral-700 text-white"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
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
