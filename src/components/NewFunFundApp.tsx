// src/components/NewFunFundApp.tsx
// This is the main application layout component.
// It holds the minimal state for the selected space and composer mode.
// It orchestrates the top-level layout and renders other smaller components.

"use client";

import { useState } from "react";
import Sidebar from "./layout/Sidebar";
import ThreadView from "./thread/ThreadView";
import ItemComposer from "./composer/ItemComposer";

// Mock data (will be replaced by Convex queries later)
const MOCK_SPACES = [
  { id: "1", name: "General", emoji: "💬" },
  { id: "2", name: "Proposals", emoji: "💡" },
  { id: "3", name: "Decisions", emoji: "⚖️" },
];

const MOCK_ITEMS = [
  {
    id: "1",
    type: "PROPOSAL",
    content: "Should we implement feature X?",
    userId: "user1",
    userName: "Alice",
    parentId: null,
    createdAt: Date.now() - 3600000,
    children: [
      {
        id: "2",
        type: "COMMENT",
        content: "I think this is a great idea!",
        userId: "user2",
        userName: "Bob",
        parentId: "1",
        createdAt: Date.now() - 1800000,
      },
      {
        id: "3",
        type: "EVALUATION",
        content: "Strong proposal with clear value",
        score: 8,
        reason: "Well researched and addresses real pain point",
        userId: "user3",
        userName: "Charlie",
        parentId: "1",
        createdAt: Date.now() - 900000,
      },
    ],
  },
];

type ComposerMode = "reaction" | "comment" | "evaluation";

export default function NewFunFundApp() {
  const [selectedSpace, setSelectedSpace] = useState("1");
  const [composerMode, setComposerMode] = useState<ComposerMode>("comment");

  return (
    <div className="h-screen flex bg-neutral-950 text-neutral-100">
      {/* Left Sidebar: Spaces */}
      <Sidebar
        spaces={MOCK_SPACES}
        selectedSpace={selectedSpace}
        onSelectSpace={setSelectedSpace}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Thread View */}
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadView items={MOCK_ITEMS} />
        </div>

        {/* Composer */}
        <ItemComposer mode={composerMode} onModeChange={setComposerMode} />
      </div>
    </div>
  );
}
