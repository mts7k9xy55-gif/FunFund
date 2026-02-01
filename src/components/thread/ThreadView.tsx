// src/components/thread/ThreadView.tsx
// This component acts as a container for displaying a list of items in a thread format.
// It receives an array of root items as props and recursively renders ItemNode components.
// It is a pure presentational component that orchestrates the display of the thread.

import ItemNode from "./ItemNode";

// Mock data (temporary, will be moved to a higher-level component)
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

export default function ThreadView({ items }: { items: typeof MOCK_ITEMS }) {
  return (
    <div className="space-y-4 max-w-4xl">
      {items.map((item) => (
        <ItemNode key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}
